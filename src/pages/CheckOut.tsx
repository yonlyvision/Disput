import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ImageUploadCard } from '../components/ui/ImageUploadCard';
import { REQUIRED_ANGLES } from '../lib/constants';
import { useAppState, useRental } from '../lib/store';
import type { VehicleAngle } from '../types';
import { AlertCircle } from 'lucide-react';

export const CheckOut = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useAppState();
  const rental = useRental(id);

  const [images, setImages] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  const handleImageCapture = (angle: VehicleAngle, _file: File | null, previewUrl: string) => {
    setImages(prev => ({ ...prev, [angle]: previewUrl }));
  };

  const completedCount = REQUIRED_ANGLES.filter(a => images[a.angle]).length;
  const isComplete = completedCount === REQUIRED_ANGLES.length;

  const handleSubmit = () => {
    if (!id) return;

    dispatch({
      type: 'SAVE_CHECKOUT',
      payload: {
        rentalId: id,
        data: { images, notes, completedAt: new Date().toISOString() },
      },
    });
    dispatch({ type: 'UPDATE_RENTAL_STATUS', payload: { rentalId: id, status: 'Check-Out Completed' } });
    dispatch({ type: 'SHOW_TOAST', payload: { message: 'Check-out inspection completed successfully!', type: 'success' } });
    navigate('/dashboard');
  };

  return (
    <div className="animate-fade-in page-wide">
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2 className="page-title">Check-Out Inspection</h2>
        <p className="page-subtitle">
          Rental #{id?.toUpperCase()}
          {rental && ` • ${rental.customer_name} • ${rental.vehicle?.year} ${rental.vehicle?.make} ${rental.vehicle?.model}`}
        </p>
      </div>

      <div className="alert-banner alert-banner--warning">
        <AlertCircle size={20} />
        <span>Capture images in good lighting. Ensure full panels are visible and avoid severe glare for optimal AI comparison.</span>
      </div>

      <div className="section-header">
        <h3 className="section-title">Required Angles</h3>
        <span className="progress-counter">{completedCount} / {REQUIRED_ANGLES.length} captured</span>
      </div>

      <div className="inspection-grid">
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

      <Card className="section-card">
        <CardHeader><h3 className="section-title">Existing Damage Notes</h3></CardHeader>
        <CardBody>
          <div className="form-group">
            <label className="form-label">Note any existing damage you want to explicitly document</label>
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

      <div className="form-actions">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Cancel</Button>
        <Button disabled={!isComplete} onClick={handleSubmit}>
          Complete Check-Out Inspection
        </Button>
      </div>
      {!isComplete && (
        <p className="validation-hint">* All {REQUIRED_ANGLES.length} required angles must be captured before submitting.</p>
      )}
    </div>
  );
};
