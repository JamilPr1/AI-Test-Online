const MAX_DIMENSION = 480;
const JPEG_QUALITY = 0.82;
export const MAX_HEADSHOT_BYTES = 350_000;

export async function compressHeadshot(source: string): Promise<string> {
  const img = await loadImage(source);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process image.');

  ctx.drawImage(img, 0, 0, width, height);
  let quality = JPEG_QUALITY;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);

  while (estimateDataUrlBytes(dataUrl) > MAX_HEADSHOT_BYTES && quality > 0.45) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  if (estimateDataUrlBytes(dataUrl) > MAX_HEADSHOT_BYTES) {
    throw new Error('Photo is too large. Please try a smaller image or retake.');
  }

  return dataUrl;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image.'));
    img.src = src;
  });
}

function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
}

export function isValidHeadshotData(data: string): boolean {
  return (
    typeof data === 'string' &&
    /^data:image\/(jpeg|jpg|png|webp);base64,/.test(data) &&
    estimateDataUrlBytes(data) <= MAX_HEADSHOT_BYTES
  );
}
