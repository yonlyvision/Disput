import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ImageUploadCard } from '../components/ui/ImageUploadCard';
import { REQUIRED_ANGLES } from '../lib/constants';
import { useAppState, useRental, pickMockAiResponse } from '../lib/store';
import type { VehicleAngle } from '../types';
import { AlertCircle, Cpu } from 'lucide-react';

export const CheckIn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useAppState();
  const rental = useRental(id);
  const [images, setImages] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageCapture = (angle: VehicleAngle, _file: File | null, previewUrl: string) => {
    setImages(prev => ({ ...prev, [angle]: previewUrl }));
  };

  const completedCount = REQUIRED_ANGLES.filter(a => images[a.angle]).length;
  const isComplete = completedCount === REQUIRED_ANGLES.length;

  const handleRunAi = () => {
    if (!id) return;
    setLoading(true);
    dispatch({ type: 'SAVE_CHECKIN', payload: { rentalId: id, data: { images, notes, completedAt: new Date().toISOString() } } });
    setTimeout(() => {
      const aiResult = pickMockAiResponse(id);
      dispatch({ type: 'SAVE_AI_RESULT', payload: { rentalId: id, data: aiResult } });
      dispatch({ type: 'UPDATE_RENTAL_STATUS', payload: { rentalId: id, status: 'AI Review Ready' } });
      dispatch({ type: 'SHOW_TOAST', payload: { message: 'AI analysis complete. Review results now.', type: 'info' } });
      navigate(`/rentals/${id}/review`);
    }, 1500);
  };

  return (
    <div className="animate-fade-in page-wide">
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2 className="page-title">Check-In Inspection</h2>
        <p className="page-subtitle">Rental #{id?.toUpperCase()}{rental && ` • ${rental.customer_name}`}</p>
      </div>
      <div className="alert-banner alert-banner--info">
        <AlertCircle size={20} />
        <span>Try to match the exact angles used during check-out for the best AI accuracy.</span>
      </div>
      <div className="section-header">
        <h3 className="section-title">Required Angles</h3>
        <span className="progress-counter">{completedCount} / {REQUIRED_ANGLES.length} captured</span>
      </div>
      <div className="inspection-grid">
        {REQUIRED_ANGLES.map(({ angle, guidance }) => (
          <ImageUploadCard key={angle} angle={angle} guidance={guidance} imagePreview={images[angle] || null} onImageCapture={handleImageCapture} />
        ))}
      </div>
      <Card className="section-card">
        <CardHeader><h3 className="section-title">Customer Return Comments</h3></CardHeader>
        <CardBody>
          <textarea className="form-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Customer noted they might have scraped the front bumper..." />
        </CardBody>
      </Card>
      <div className="form-actions">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Cancel</Button>
        <Button disabled={!isComplete || loading} onClick={handleRunAi}>
          {loading ? 'Processing Images...' : <><Cpu size={18} /> Run AI Comparison</>}
        </Button>
      </div>
      {!isComplete && <p className="validation-hint">* All {REQUIRED_ANGLES.length} required angles must be captured.</p>}
    </div>
  );
};
