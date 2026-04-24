import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { VideoCapture } from '../components/ui/VideoCapture';
import { Button } from '../components/ui/Button';
import { submitCustomerPhotos, isSupabaseConfigured } from '../lib/submissions';
import { Video, CheckCircle2, Loader2, AlertCircle, Car, Play } from 'lucide-react';

type Screen = 'capture' | 'submitting' | 'success' | 'error';

export const CaptureLink = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const vehicleLabel = searchParams.get('v') || 'Vehicle';
  const captureType = (searchParams.get('type') as 'checkout' | 'checkin') || 'checkin';

  const [frames, setFrames] = useState<string[]>([]);
  const [videoCaptureOpen, setVideoCaptureOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [screen, setScreen] = useState<Screen>('capture');
  const [errorMsg, setErrorMsg] = useState('');

  const hasVideo = frames.length > 0;

  const handleSubmit = async () => {
    if (!id || !hasVideo) return;

    if (!isSupabaseConfigured()) {
      setErrorMsg('Photo submission is not configured yet. Please contact the rental company.');
      setScreen('error');
      return;
    }

    setScreen('submitting');
    // Store frames as indexed images for Supabase compatibility
    const images: Record<string, string> = {};
    frames.forEach((f, i) => { images[`frame_${i}`] = f; });

    const result = await submitCustomerPhotos(id, images, notes, 'customer');
    if (result.ok) {
      setScreen('success');
    } else {
      setErrorMsg(result.error || 'Submission failed. Please try again.');
      setScreen('error');
    }
  };

  if (screen === 'success') {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', padding: '2rem', textAlign: 'center' }}>
        <CheckCircle2 size={64} style={{ color: '#10b981', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#065f46' }}>Video Submitted</h1>
        <p style={{ color: '#374151', maxWidth: '320px', lineHeight: 1.6 }}>
          Your walkthrough video for <strong>{vehicleLabel}</strong> (Rental #{id?.toUpperCase()}) has been received. The rental team has been notified.
        </p>
        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>You may close this tab.</p>
      </div>
    );
  }

  if (screen === 'error') {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1f2', padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={64} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#991b1b' }}>Submission Failed</h1>
        <p style={{ color: '#374151', maxWidth: '320px', lineHeight: 1.6 }}>{errorMsg}</p>
        <button onClick={() => setScreen('capture')} style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    );
  }

  if (screen === 'submitting') {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', padding: '2rem', textAlign: 'center' }}>
        <Loader2 size={48} style={{ color: '#2563eb', marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#374151', fontWeight: 600 }}>Uploading your video frames...</p>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>Please keep this page open.</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100svh', paddingBottom: '5rem' }}>
      <VideoCapture
        isOpen={videoCaptureOpen}
        onClose={() => setVideoCaptureOpen(false)}
        onFramesExtracted={setFrames}
        title={captureType === 'checkout' ? 'Pick-Up Walkthrough' : 'Return Walkthrough'}
      />

      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid var(--border-light)', padding: '1rem 1.25rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Video size={22} style={{ color: 'var(--brand-primary)' }} />
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1 }}>
              {captureType === 'checkout' ? 'Pick-Up Inspection' : 'Return Inspection'}
            </p>
            <p style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>Rental #{id?.toUpperCase()}</p>
          </div>
        </div>
        {vehicleLabel && (
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <Car size={14} /> {vehicleLabel}
          </div>
        )}
      </div>

      <div style={{ padding: '1rem' }}>
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#92400e', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          <strong>Instructions:</strong> Record a slow, steady video as you walk around the entire vehicle — starting from the front, going clockwise: front → passenger side → rear → driver side → back to front. These frames are permanently recorded and legally documented.
        </div>

        {/* Video card */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', border: `2px solid ${hasVideo ? '#10b981' : '#e2e8f0'}`, padding: '1.25rem', marginBottom: '1rem' }}>
          {hasVideo ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} /> {frames.length} frames captured
                </span>
                <button onClick={() => setVideoCaptureOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Play size={13} /> Retake
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '6px' }}>
                {frames.map((f, i) => (
                  <div key={i} style={{ aspectRatio: '16/9', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                    <img src={f} alt={`Frame ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setVideoCaptureOpen(true)}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '2rem 1rem', textAlign: 'center' }}
            >
              <Video size={48} style={{ color: '#94a3b8', margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.25rem' }}>Record Vehicle Walkthrough</p>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Tap to open camera</p>
            </button>
          )}
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '1rem' }}>
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
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTop: '1px solid var(--border-light)', padding: '1rem', zIndex: 100 }}>
        <Button
          style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', fontWeight: 700 }}
          disabled={!hasVideo}
          onClick={handleSubmit}
        >
          {hasVideo ? <><CheckCircle2 size={18} /> Submit Video</> : 'Record a video first'}
        </Button>
      </div>
    </div>
  );
};
