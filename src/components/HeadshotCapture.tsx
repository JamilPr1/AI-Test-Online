'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { compressHeadshot } from '@/lib/image';

interface HeadshotCaptureProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  error?: string;
}

export default function HeadshotCapture({ value, onChange, error }: HeadshotCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [cameraError, setCameraError] = useState('');
  const [processing, setProcessing] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (value) setMode('preview');
  }, [value]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setMode('camera');
    } catch {
      setCameraError('Camera access denied. Upload a photo instead.');
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    setProcessing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Capture failed.');
      ctx.drawImage(video, 0, 0);
      const compressed = await compressHeadshot(canvas.toDataURL('image/jpeg', 0.92));
      onChange(compressed);
      stopCamera();
      setMode('preview');
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : 'Could not capture photo.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFile = async (file: File) => {
    setCameraError('');
    setProcessing(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Could not read file.'));
        reader.readAsDataURL(file);
      });
      const compressed = await compressHeadshot(dataUrl);
      onChange(compressed);
      setMode('preview');
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : 'Could not process image.');
    } finally {
      setProcessing(false);
    }
  };

  const clearPhoto = () => {
    onChange(null);
    stopCamera();
    setMode('idle');
    setCameraError('');
  };

  return (
    <div className="space-y-3">
      <label className="label">
        Headshot Selfie <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-slate-500 -mt-1 mb-2">
        Take a clear front-facing photo. This will be saved with your test submission for identity verification.
      </p>

      {mode === 'preview' && value ? (
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border-2 border-brand-200 bg-brand-50/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Your headshot"
            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
          />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-800">Photo captured</p>
            <button type="button" className="btn-secondary text-sm" onClick={clearPhoto}>
              Retake Photo
            </button>
          </div>
        </div>
      ) : mode === 'camera' ? (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900">
          <video ref={videoRef} className="w-full max-h-72 object-cover mirror" playsInline muted />
          <div className="p-3 flex flex-wrap gap-2 bg-slate-800">
            <button
              type="button"
              className="btn-primary text-sm flex-1"
              onClick={capturePhoto}
              disabled={processing}
            >
              {processing ? 'Processing…' : 'Capture'}
            </button>
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => {
                stopCamera();
                setMode('idle');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/50 transition-colors text-sm font-medium text-slate-700"
            onClick={startCamera}
          >
            <CameraIcon />
            Use Camera
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/50 transition-colors text-sm font-medium text-slate-700"
            onClick={() => fileRef.current?.click()}
          >
            <UploadIcon />
            Upload Photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {(error || cameraError) && (
        <p className="text-sm text-red-600">{error || cameraError}</p>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}
