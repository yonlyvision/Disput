import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ImageUploadCard } from '../components/ui/ImageUploadCard';
import { REQUIRED_ANGLES } from '../lib/constants';
import { useAppState, useRental } from '../lib/store';
import { runAiComparison } from '../lib/openai';
import type { VehicleAngle } from '../types';
import { AlertCircle, Cpu, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export const CheckIn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useAppState();
  const rental = useRental(id);
  const [images, setImages] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showReference, setShowReference] = useState(true);

  const checkoutImages = state.inspections[id ?? '']?.checkout?.images ?? {};

  const handleImageCapture = (angle: VehicleAngle, _file: File | null, previewUrl: string) => {
    setImages(prev => ({ ...prev, [angle]: previewUrl }));
  };

  const completedCount = REQUIRED_ANGLES.filter(a => images[a.angle]).length;
  const isComplete = completedCount === REQUIRED_ANGLES.length;

  const handleRunAi = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    dispatch({
      type: 'SAVE_CHECKIN',
      payload: { rentalId: id, data: { images, notes, completedAt: new Date().toISOString() } },
    });

    const checkoutImages2 = state.inspections[id]?.checkout?.images ?? {};
    const existingNotes = state.inspections[id]?.checkout?.notes ?? '';

    const angleImages = REQUIRED_ANGLES.map(({ angle }) => ({
      angle,
      checkout: checkoutImages2[angle] ?? null,
      checkin: images[angle] ?? null,
    }));

    try {
      setLoadingStep('Resizing images...');
      // Small delay so UI updates before the async work
      await new Promise(r => setTimeout(r, 50));

      setLoadingStep('Sending to AI for comparison...');
      const aiResult = await runAiComparison(angleImages, existingNotes, notes);

      dispatch({ type: 'SAVE_AI_RESULT', payload: { rentalId: id, data: aiResult } });
      dispatch({ type: 'UPDATE_RENTAL_STATUS', payload: { rentalId: id, status: 'AI Review Ready' } });
      dispatch({ type: 'SHOW_TOAST', payload: { message: 'AI analysis complete. Review results now.', type: 'info' } });
      navigate(`/rentals/${id}/review`);
    } catch (err) {
      console.error('AI comparison failed:', err);
      setError(
        err instanceof Error
          ? `AI analysis failed: ${err.message}`
          : 'AI analysis failed. Please try again.'
      );
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="animate-fade-in page-wide">
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2 className="page-title">Check-In Inspection</h2>
        <p className="page-subtitle">Rental #{id?.toUpperCase()}{rental && ` • ${rental.customer_name}`}</p>
      </div>

      <div className="alert-banner alert-banner--info">
        <AlertCircle size={20} />
        <span>Match the exact angles used during check-out for the best AI accuracy.</span>
      </div>

      {/* Check-out reference photos */}
      {Object.keys(checkoutImages).length > 0 && (
        <Card className="section-card" style={{ borderColor: 'var(--brand-primary)' }}>
          <CardHeader
            onClick={() => setShowReference(r => !r)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
          >
            <h3 className="section-title" style={{ marginBottom: 0, color: 'var(--brand-primary)' }}>
              Check-Out Reference Photos
            </h3>
            {showReference ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </CardHeader>
          {showReference && (
            <CardBody>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-3)' }}>
                Match these angles exactly when capturing check-in photos for accurate AI comparison.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--spacing-3)' }}>
                {REQUIRED_ANGLES.map(({ angle }) => {
                  const img = checkoutImages[angle];
                  return (
                    <div key={angle}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>{angle}</span>
                      <div style={{ height: '90px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        {img
                          ? <img src={img} alt={angle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>—</div>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          )}
        </Card>
      )}

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
        <CardHeader><h3 className="section-title">Customer Return Comments</h3></CardHeader>
        <CardBody>
          <textarea
            className="form-input"
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g., Customer noted they might have scraped the front bumper..."
          />
        </CardBody>
      </Card>

      {error && (
        <div className="alert-banner" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', borderColor: 'var(--danger)' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="form-actions">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Cancel</Button>
        <Button disabled={!isComplete || loading} onClick={handleRunAi}>
          {loading
            ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> {loadingStep || 'Processing...'}</>
            : <><Cpu size={18} /> Run AI Comparison</>
          }
        </Button>
      </div>

      {!isComplete && <p className="validation-hint">* All {REQUIRED_ANGLES.length} required angles must be captured.</p>}
    </div>
  );
};
