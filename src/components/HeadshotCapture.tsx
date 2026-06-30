'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  compressHeadshotFile,
  compressHeadshotFromVideo,
  isCameraSupported,
} from '@/lib/image';

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
  const [cameraReady, setCameraReady] = useState(false);
  const cameraSupported = isCameraSupported();

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (value) setMode('preview');
  }, [value]);

  // Attach stream after the <video> element is mounted (mode === 'camera')
  useEffect(() => {
    if (mode !== 'camera' || !streamRef.current) return;

    let cancelled = false;
    const video = videoRef.current;
    if (!video) return;

    const stream = streamRef.current;
    video.srcObject = stream;
    setCameraReady(false);

    const markReady = () => {
      if (!cancelled && video.videoWidth > 0 && video.videoHeight > 0) {
        setCameraReady(true);
      }
    };

    video.addEventListener('loadedmetadata', markReady);
    video.addEventListener('playing', markReady);

    video.play().then(markReady).catch(() => {
      if (!cancelled) {
        setCameraError('Could not start camera preview. Try uploading a photo instead.');
      }
    });

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', markReady);
      video.removeEventListener('playing', markReady);
    };
  }, [mode]);

  const startCamera = async () => {
    setCameraError('');

    if (!cameraSupported) {
      setCameraError(
        'Camera requires HTTPS or localhost. Upload a photo instead, or open this site via https://.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setMode('camera');
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Allow camera access in your browser, or upload a photo.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please upload a photo instead.');
      } else {
        setCameraError('Could not access camera. Please upload a photo instead.');
      }
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || !cameraReady) {
      setCameraError('Camera is still starting. Wait a second and try again.');
      return;
    }

    setProcessing(true);
    setCameraError('');
    try {
      const compressed = await compressHeadshotFromVideo(video, true);
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
      const compressed = await compressHeadshotFile(file);
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

  const cancelCamera = () => {
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
          <div className="relative bg-black min-h-[240px] flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full max-h-80 object-cover mirror"
              playsInline
              muted
              autoPlay
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-white text-sm">
                Starting camera…
              </div>
            )}
          </div>
          <div className="p-3 flex flex-wrap gap-2 bg-slate-800">
            <button
              type="button"
              className="btn-primary text-sm flex-1"
              onClick={capturePhoto}
              disabled={processing || !cameraReady}
            >
              {processing ? 'Processing…' : 'Capture Photo'}
            </button>
            <button type="button" className="btn-secondary text-sm" onClick={cancelCamera}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/50 transition-colors text-sm font-medium text-slate-700 disabled:opacity-50"
            onClick={startCamera}
            disabled={!cameraSupported}
            title={!cameraSupported ? 'Camera requires HTTPS or localhost' : undefined}
          >
            <CameraIcon />
            {cameraSupported ? 'Use Camera' : 'Camera (HTTPS required)'}
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/50 transition-colors text-sm font-medium text-slate-700"
            onClick={() => fileRef.current?.click()}
            disabled={processing}
          >
            <UploadIcon />
            Upload Photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            capture="user"
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
