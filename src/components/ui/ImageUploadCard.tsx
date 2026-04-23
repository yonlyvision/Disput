import React, { useState } from 'react';
import { Card, CardBody } from './Card';
import { Button } from './Button';
import { Camera, CheckCircle2, RefreshCcw } from 'lucide-react';
import type { VehicleAngle } from '../../types';
import { CameraModal } from './CameraModal';

interface ImageUploadCardProps {
  angle: VehicleAngle;
  guidance: string;
  imagePreview: string | null;
  onImageCapture: (angle: VehicleAngle, file: File | null, previewUrl: string) => void;
}

export const ImageUploadCard: React.FC<ImageUploadCardProps> = ({ angle, guidance, imagePreview, onImageCapture }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleCapture = (imageUrl: string) => {
    // In a real app, you might want to convert the base64 URL to a File object here
    // For MVP, passing the URL is sufficient to display it.
    onImageCapture(angle, null, imageUrl);
  };

  const isCompleted = !!imagePreview;

  return (
    <>
      <Card style={{ borderColor: isCompleted ? 'var(--success)' : 'var(--border-light)' }}>
        <CardBody>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
            <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              {angle}
              {isCompleted && <CheckCircle2 size={18} color="var(--success)" />}
            </h4>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-4)' }}>
            {guidance}
          </p>

          {isCompleted ? (
            <div style={{ position: 'relative', width: '100%', height: '150px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)' }}>
              <img src={imagePreview!} alt={`${angle} preview`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 'var(--spacing-2)', right: 'var(--spacing-2)' }}>
                <Button variant="secondary" onClick={() => setIsCameraOpen(true)} style={{ padding: 'var(--spacing-1) var(--spacing-2)', fontSize: 'var(--text-xs)' }}>
                  <RefreshCcw size={14} style={{ marginRight: 'var(--spacing-1)' }} /> Retake
                </Button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setIsCameraOpen(true)}
              style={{ 
                width: '100%', 
                height: '150px', 
                border: '2px dashed var(--border-dark)', 
                borderRadius: 'var(--radius-md)', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-tertiary)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-dark)'}
            >
              <Camera size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--spacing-2)' }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--brand-primary)', fontWeight: 'var(--font-medium)' }}>Live Camera</span>
            </div>
          )}
        </CardBody>
      </Card>

      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={handleCapture} 
        title={`Capture ${angle}`} 
      />
    </>
  );
};
