import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Upload, ShieldCheck, CheckCircle, Sparkles } from 'lucide-react';

interface CameraViewfinderProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureImage: (base64Image: string) => void;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  isOpen,
  onClose,
  onCaptureImage,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera niet geopend:', err);
      setCameraError(
        'Kon de camera niet direct openen. Geef toestemming of kies een foto uit uw galerij.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(base64);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCapturedImage(base64);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const confirmSnapshot = () => {
    if (capturedImage) {
      onCaptureImage(capturedImage);
      onClose();
    }
  };

  const retakeSnapshot = () => {
    setCapturedImage(null);
    startCamera();
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-[calc(100%-24px)] max-w-xl p-4 sm:p-6 shadow-2xl border-4 border-blue-600 flex flex-col max-h-[calc(100dvh-24px)] overflow-y-auto overflow-x-hidden">
        
        {/* Top bar */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200 shrink-0">
          <div className="flex items-center gap-2 text-blue-950 font-black text-lg sm:text-xl">
            <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            <span>Kijk mee met mijn scherm</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Sluiten"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Instructions banner */}
        <div className="mt-3 bg-blue-50 border-2 border-blue-200 rounded-2xl p-3 text-blue-950 text-sm font-semibold flex items-center gap-2">
          <span className="text-xl">📺</span>
          <span>Richt uw telefoon rustig op het computerscherm of de foutmelding.</span>
        </div>

        {/* Viewfinder area */}
        <div className="relative my-4 aspect-4/3 w-full bg-slate-900 rounded-2xl overflow-hidden border-3 border-slate-700 flex items-center justify-center shadow-inner">
          
          {!capturedImage ? (
            <>
              {cameraError ? (
                <div className="p-6 text-center text-white space-y-4">
                  <p className="text-amber-300 font-bold text-lg">{cameraError}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl text-base inline-flex items-center gap-2 shadow-lg min-h-[50px]"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Foto kiezen uit galerij</span>
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Framing Overlay Guide */}
                  <div className="absolute inset-4 border-2 border-dashed border-amber-300/80 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-between text-amber-300 text-xs font-bold bg-slate-950/60 px-2 py-1 rounded w-fit">
                      <span>[ Computerscherm in beeld ]</span>
                    </div>
                    <div className="self-center text-amber-300 font-bold text-xs bg-slate-950/70 px-3 py-1 rounded-full animate-pulse">
                      Houd de camera stil
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="relative w-full h-full">
              <img
                src={capturedImage}
                alt="Vastgelegde foto"
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute top-3 left-3 bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                <CheckCircle className="w-4 h-4" />
                <span>Foto genomen</span>
              </div>
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!capturedImage ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={takeSnapshot}
                disabled={!!cameraError}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-lg py-4 px-6 rounded-2xl shadow-lg border-2 border-blue-400 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[60px]"
              >
                <Camera className="w-7 h-7" />
                <span>📸 Analyseer scherm</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base py-3 px-4 rounded-2xl border-2 border-slate-300 flex items-center justify-center gap-2 min-h-[60px]"
              >
                <Upload className="w-5 h-5 text-slate-700" />
                <span>Foto uploaden</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmSnapshot}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xl py-4 px-6 rounded-2xl shadow-lg border-2 border-emerald-400 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[60px]"
              >
                <Sparkles className="w-6 h-6 text-amber-300" />
                <span>Ja, analyseer dit scherm</span>
              </button>

              <button
                onClick={retakeSnapshot}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-lg py-3 px-6 rounded-2xl border-2 border-slate-300 flex items-center justify-center gap-2 active:scale-98 transition-all min-h-[52px]"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Nieuwe foto maken</span>
              </button>
            </div>
          )}

          {/* Switch camera button if multi cameras */}
          {!capturedImage && !cameraError && (
            <div className="flex justify-center">
              <button
                onClick={switchCamera}
                className="text-xs text-blue-700 font-bold hover:underline py-1 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Draai camera om</span>
              </button>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Privacy reassurance */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Uw privacy is beschermd: beelden worden na de analyse direct gewist.</span>
        </div>

      </div>
    </div>
  );
};
