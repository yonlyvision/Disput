import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ImageUploadCard } from '../components/ui/ImageUploadCard';
import type { VehicleAngle } from '../types';
import { AlertCircle } from 'lucide-react';

const REQUIRED_ANGLES: { angle: VehicleAngle; guidance: string }[] = [
  { angle: 'Front', guidance: 'Capture the entire front bumper, grille, and headlights.' },
  { angle: 'Front-Left', guidance: 'Include the front left wheel and fender.' },
  { angle: 'Left Side', guidance: 'Capture both doors and the full length of the left side.' },
  { angle: 'Rear-Left', guidance: 'Include the rear left wheel and quarter panel.' },
  { angle: 'Rear', guidance: 'Capture the entire rear bumper, trunk, and taillights.' },
  { angle: 'Rear-Right', guidance: 'Include the rear right wheel and quarter panel.' },
  { angle: 'Right Side', guidance: 'Capture both doors and the full length of the right side.' },
  { angle: 'Front-Right', guidance: 'Include the front right wheel and fender.' },
];

export const CheckOut = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  const handleImageCapture = (angle: VehicleAngle, _file: File | null, previewUrl: string) => {
    setImages(prev => ({ ...prev, [angle]: previewUrl }));
  };

  const isComplete = REQUIRED_ANGLES.every(a => images[a.angle]);

  const handleSubmit = () => {
    // Navigate back to dashboard or to a success page
    navigate('/dashboard');
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--spacing-1)' }}>Check-Out Inspection</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Rental #{id?.toUpperCase()}</p>
      </div>

      <div style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)', padding: 'var(--spacing-3) var(--spacing-4)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-6)' }}>
        <AlertCircle size={20} />
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>
          Please capture images in good lighting. Ensure full panels are visible and avoid severe glare to optimize AI comparison later.
        </span>
      </div>

      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--spacing-4)' }}>Required Angles</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-8)' }}>
        {REQUIRED_ANGLES.map(({ angle, guidance }) => (
          <ImageUploadCard
            key={angle}
            angle={angle}
            guidance={guidance}
            imagePreview={images[angle] || null}
            onImageCapture={handleImageCapture}
          />
        ))}
      </div>

      <Card style={{ marginBottom: 'var(--spacing-6)' }}>
        <CardHeader>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Existing Damage Notes</h3>
        </CardHeader>
        <CardBody>
          <div className="form-group">
            <label className="form-label">Note any existing damage that you want to explicitly document</label>
            <textarea 
              className="form-input" 
              rows={4} 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="e.g., Small rock chip on windshield..."
            />
          </div>
          <ImageUploadCard
            angle="Close-up"
            guidance="Optional close-up of existing damage"
            imagePreview={images['Close-up'] || null}
            onImageCapture={handleImageCapture}
          />
        </CardBody>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Cancel</Button>
        <Button 
          disabled={!isComplete} 
          onClick={handleSubmit}
        >
          Complete Check-Out Inspection
        </Button>
      </div>
      {!isComplete && (
        <p style={{ textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--danger)', marginTop: 'var(--spacing-2)' }}>
          * All required angles must be captured before submitting.
        </p>
      )}
    </div>
  );
};
