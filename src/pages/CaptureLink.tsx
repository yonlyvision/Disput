import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ImageUploadCard } from '../components/ui/ImageUploadCard';
import { Button } from '../components/ui/Button';
import { REQUIRED_ANGLES } from '../lib/constants';
import { submitCustomerPhotos, isSupabaseConfigured } from '../lib/submissions';
import type { VehicleAngle } from '../types';
import { Camera, CheckCircle2, Loader2, AlertCircle, Car } from 'lucide-react';

type Screen = 'capture' | 'submitting' | 'success' | 'error';

export const CaptureLink = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const vehicleLabel = searchParams.get('v') || 'Vehicle';
  const captureType = (searchParams.get('type') as 'checkout' | 'checkin') || 'checkin';

  const [images, setImages] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [screen, setScreen] = useState<Screen>('capture');
  const [errorMsg, setErrorMsg] = useState('');

  const handleImageCapture = (angle: VehicleAngle, _file: File | null, previewUrl: string) => {
    setImages(prev => ({ ...prev, [angle]: previewUrl }));
  };

  const completedCount = REQUIRED_ANGLES.filter(a => images[a.angle]).length;
  const isComplete = completedCount === REQUIRED_ANGLES.length;

  const handleSubmit = async () => {
    if (!id || !isComplete) return;

    if (!isSupabaseConfigured()) {
      setErrorMsg('Photo submission is not configured yet. Please contact the rental company.');
      setScreen('error');
      return;
    }

    setScreen('submitting');
    const result = await submitCustomerPhotos(id, images, notes, 'customer');

    if (result.ok) {
      setScreen('success');
    } else {
      setErrorMsg(result.error || 'Submission failed. Please try again.');
      setScreen('error');
    }
  };

  // ── Success screen ──────────────────────────────────────────
  if (screen === 'success') {
    return (
      <div style={{
        minHeight: '100svh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#f0fdf4', padding: '2rem', textAlign: 'center',
      }}>
        <CheckCircle2 size={64} style={{ color: '#10b981', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#065f46' }}>
          Photos Submitted
        </h1>
        <p style={{ color: '#374151', maxWidth: '320px', lineHeight: 1.6 }}>
          Your photos for <strong>{vehicleLabel}</strong> (Rental #{id?.toUpperCase()}) have been received.
          The rental team has been notified.
        </p>
        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          You may close this tab.
        </p>
      </div>
    );
  }

  // ── Error screen ────────────────────────────────────────────
  if (screen === 'error') {
    return (
      <div style={{
        minHeight: '100svh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff1f2', padding: '2rem', textAlign: 'center',
      }}>
        <AlertCircle size={64} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#991b1b' }}>
          Submission Failed
        </h1>
        <p style={{ color: '#374151', maxWidth: '320px', lineHeight: 1.6 }}>
          {errorMsg}
        </p>
        <button
          onClick={() => setScreen('capture')}
          style={{
            marginTop: '1.5rem', padding: '0.75rem 1.5rem',
            backgroundColor: '#ef4444', color: 'white',
            border: 'none', borderRadius: '0.5rem',
            fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Submitting screen ───────────────────────────────────────
  if (screen === 'submitting') {
    return (
      <div style={{
        minHeight: '100svh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'white', padding: '2rem', textAlign: 'center',
      }}>
        <Loader2 size={48} style={{ color: '#2563eb', marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#374151', fontWeight: 600 }}>Uploading your photos...</p>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>Please keep this page open.</p>
      </div>
    );
  }

  // ── Capture screen ──────────────────────────────────────────
  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100svh', paddingBottom: '6rem' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--border-light)',
        padding: '1rem 1.25rem', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Camera size={22} style={{ color: 'var(--brand-primary)' }} />
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1 }}>
              {captureType === 'checkout' ? 'Pick-Up Inspection' : 'Return Inspection'}
            </p>
            <p style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>
              Rental #{id?.toUpperCase()}
            </p>
          </div>
        </div>
        {vehicleLabel && (
          <div style={{
            marginTop: '0.5rem', display: 'flex', alignItems: 'center',
            gap: '0.375rem', fontSize: '0.875rem', color: 'var(--text-secondary)',
          }}>
            <Car size={14} /> {vehicleLabel}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ backgroundColor: 'var(--border-light)', height: '4px' }}>
        <div style={{
          width: `${(completedCount / REQUIRED_ANGLES.length) * 100}%`,
          height: '100%', backgroundColor: 'var(--brand-primary)',
          transition: 'width 0.3s ease',
        }} />
      </div>

      <div style={{ padding: '1rem 1rem 0' }}>
        <div style={{
          backgroundColor: '#fffbeb', border: '1px solid #fbbf24',
          borderRadius: '0.5rem', padding: '0.75rem 1rem',
          fontSize: '0.8125rem', color: '#92400e', lineHeight: 1.5, marginBottom: '1rem',
        }}>
          <strong>Instructions:</strong> Take a clear photo of each angle of the vehicle.
          Make sure the full panel is visible and there is no glare. These photos are permanent and legally documented.
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Vehicle Photos</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {completedCount} / {REQUIRED_ANGLES.length}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
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

        {/* Notes */}
        <div style={{ marginTop: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
            Any comments? <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            className="form-input"
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. There was already a scratch on the rear bumper when I picked up the car."
            style={{ fontSize: '1rem' }}
          />
        </div>
      </div>

      {/* Sticky submit footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: 'white', borderTop: '1px solid var(--border-light)',
        padding: '1rem', zIndex: 100,
      }}>
        <Button
          style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', fontWeight: 700 }}
          disabled={!isComplete}
          onClick={handleSubmit}
        >
          {isComplete
            ? <><CheckCircle2 size={18} /> Submit Photos</>
            : `${completedCount} / ${REQUIRED_ANGLES.length} photos required`
          }
        </Button>
      </div>
    </div>
  );
};
