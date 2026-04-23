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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.error("Camera access denied or unavailable", err);
          setError("Camera access denied or unavailable. Please check permissions.");
        });
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL('image/jpeg');
        onCapture(imageUrl);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ position: 'absolute', top: 'var(--spacing-4)', right: 'var(--spacing-4)', zIndex: 10 }}>
        <Button variant="ghost" onClick={onClose} style={{ color: 'white' }}>
          <X size={24} />
        </Button>
      </div>
      
      <div style={{ color: 'white', marginBottom: 'var(--spacing-4)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)' }}>{title}</h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Align the vehicle within the frame</p>
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '600px', backgroundColor: 'black', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {error ? (
          <div style={{ padding: 'var(--spacing-8)', color: 'var(--danger)', textAlign: 'center' }}>{error}</div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' /* mirror if front camera, but environment is usually back. We will keep normal for environment */ }} 
          />
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {!error && (
        <div style={{ marginTop: 'var(--spacing-8)' }}>
          <button 
            onClick={handleCapture}
            style={{
              width: '80px', height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-primary)',
              border: '4px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <Camera size={32} color="white" />
          </button>
        </div>
      )}
    </div>
  );
};
