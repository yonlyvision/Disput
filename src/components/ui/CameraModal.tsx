import React, { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from './Button';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageBlobUrl: string) => void;
  title: string;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setReady(false);
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }
      })
        .then(s => {
          streamRef.current = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.onloadedmetadata = () => setReady(true);
          }
        })
        .catch(err => {
          console.error("Camera access denied or unavailable", err);
          setError("Camera access denied. Please allow camera permissions and try again.");
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setReady(false);
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Compress: resize to max 1200px wide
      const maxWidth = 1200;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL('image/jpeg', 0.85);
        onCapture(imageUrl);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="camera-overlay">
      <div style={{ position: 'absolute', top: 'var(--spacing-4)', right: 'var(--spacing-4)', zIndex: 10 }}>
        <Button variant="ghost" onClick={onClose} style={{ color: 'white' }}>
          <X size={24} />
        </Button>
      </div>

      <div style={{ color: 'white', marginBottom: 'var(--spacing-4)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)' }}>{title}</h2>
        <p style={{ fontSize: 'var(--text-sm)', opacity: 0.7 }}>Align the vehicle panel within the frame</p>
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '640px', backgroundColor: '#111', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {error ? (
          <div style={{ padding: 'var(--spacing-8)', color: 'var(--danger)', textAlign: 'center' }}>{error}</div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', display: 'block' }}
            />
            {/* Crosshair overlay */}
            {ready && (
              <div style={{
                position: 'absolute', inset: 0,
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: 'var(--radius-lg)',
                pointerEvents: 'none',
              }}>
                <div style={{
                  position: 'absolute', top: '33%', left: 0, right: 0,
                  borderTop: '1px dashed rgba(255,255,255,0.15)',
                }} />
                <div style={{
                  position: 'absolute', top: '66%', left: 0, right: 0,
                  borderTop: '1px dashed rgba(255,255,255,0.15)',
                }} />
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {!error && (
        <div style={{ marginTop: 'var(--spacing-6)' }}>
          <button
            onClick={handleCapture}
            disabled={!ready}
            className="camera-shutter-btn"
          >
            <Camera size={32} color="white" />
          </button>
        </div>
      )}
    </div>
  );
};
