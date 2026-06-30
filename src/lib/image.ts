const MAX_DIMENSION = 480;
const JPEG_QUALITY = 0.82;
export const MAX_HEADSHOT_BYTES = 350_000;

export async function compressHeadshot(source: string): Promise<string> {
  const bitmap = await decodeImageSource(source);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not process image.');

    ctx.drawImage(bitmap, 0, 0, width, height);
    return encodeCanvasToJpeg(canvas);
  } finally {
    if ('close' in bitmap && typeof bitmap.close === 'function') {
      bitmap.close();
    }
  }
}

export async function compressHeadshotFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a JPEG, PNG, or WebP image.');
  }
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not process image.');

    ctx.drawImage(bitmap, 0, 0, width, height);
    return encodeCanvasToJpeg(canvas);
  } finally {
    bitmap.close();
  }
}

export async function compressHeadshotFromVideo(
  video: HTMLVideoElement,
  mirror = true
): Promise<string> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) {
    throw new Error('Camera is not ready yet. Wait a moment and try again.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not capture photo.');

  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, width, height);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  if (scale < 1) {
    const scaled = document.createElement('canvas');
    scaled.width = Math.round(width * scale);
    scaled.height = Math.round(height * scale);
    const sctx = scaled.getContext('2d');
    if (!sctx) throw new Error('Could not process image.');
    sctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
    return encodeCanvasToJpeg(scaled);
  }

  return encodeCanvasToJpeg(canvas);
}

async function decodeImageSource(
  source: string
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap !== 'undefined') {
    try {
      const blob = dataUrlToBlob(source);
      if (blob) return await createImageBitmap(blob);
    } catch {
      // fall through to Image()
    }
  }

  return loadImageElement(source);
}

function encodeCanvasToJpeg(canvas: HTMLCanvasElement): string {
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

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [header, base64] = dataUrl.split(',');
    if (!base64) return null;
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new Error(
          'Could not load image. Use JPEG or PNG, or take a photo with your camera.'
        )
      );
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

export function isCameraSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.isSecureContext) &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}
