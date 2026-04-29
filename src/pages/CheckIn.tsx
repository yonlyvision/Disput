import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { VideoCapture } from '../components/ui/VideoCapture';
import { useAppState, useRental } from '../lib/store';
import { runAiComparison } from '../lib/openai';
import { AlertCircle, Cpu, Loader2, Video, CheckCircle2, Play, ChevronDown, ChevronUp, Inbox } from 'lucide-react';

export const CheckIn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useAppState();
  const rental = useRental(id);

  const checkoutData = state.inspections[id ?? '']?.checkout;
  const checkinData = state.inspections[id ?? '']?.checkin;
  const checkoutFrames = checkoutData?.frames ?? [];
  const hasCheckoutRef = checkoutFrames.length > 0;

  // Pre-load imported customer frames if they exist in state (from Dashboard import)
  const [frames, setFrames] = useState<string[]>(() => checkinData?.frames ?? []);
  const [notes, setNotes] = useState(() => checkinData?.notes ?? '');
  const [videoCaptureOpen, setVideoCaptureOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showRefFrames, setShowRefFrames] = useState(true);

  const hasVideo = frames.length > 0;
  const isImported = !!checkinData?.frames?.length && frames === checkinData.frames;

  const handleRunAi = async () => {
    if (!id || !hasVideo) return;
    setLoading(true);
    setError(null);

    dispatch({
      type: 'SAVE_CHECKIN',
      payload: { rentalId: id, data: { images: {}, frames, notes, completedAt: new Date().toISOString() } },
    });

    const existingNotes = checkoutData?.notes ?? '';

    try {
      setLoadingStep('Sending frames to AI...');
      await new Promise(r => setTimeout(r, 50));

      const aiResult = await runAiComparison(checkoutFrames, frames, existingNotes, notes);

      dispatch({ type: 'SAVE_AI_RESULT', payload: { rentalId: id, data: aiResult } });
      dispatch({ type: 'UPDATE_RENTAL_STATUS', payload: { rentalId: id, status: 'AI Review Ready' } });
      dispatch({ type: 'SHOW_TOAST', payload: { message: 'AI analysis complete.', type: 'info' } });
      navigate(`/rentals/${id}/review`);
    } catch (err) {
      setError(err instanceof Error ? `AI analysis failed: ${err.message}` : 'AI analysis failed. Please try again.');
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="animate-fade-in page-wide">
      <VideoCapture
        isOpen={videoCaptureOpen}
        onClose={() => setVideoCaptureOpen(false)}
        onFramesExtracted={setFrames}
        title="Check-In Walkthrough"
      />

      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2 className="page-title">Check-In Inspection</h2>
        <p className="page-subtitle">Rental #{id?.toUpperCase()}{rental && ` • ${rental.customer_name}`}</p>
      </div>

      <div className="alert-banner alert-banner--info">
        <AlertCircle size={20} />
        <span>Walk around the entire vehicle at the same pace and in the same direction as the check-out video for the best AI comparison.</span>
      </div>

      {/* Checkout reference frames */}
      {hasCheckoutRef && (
        <Card className="section-card" style={{ borderColor: 'var(--brand-primary)' }}>
          <CardHeader
            onClick={() => setShowRefFrames(r => !r)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
          >
            <h3 className="section-title" style={{ marginBottom: 0, color: 'var(--brand-primary)' }}>
              Check-Out Reference Frames ({checkoutFrames.length})
            </h3>
            {showRefFrames ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </CardHeader>
          {showRefFrames && (
            <CardBody>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-3)' }}>
                This is how the vehicle looked at checkout. Walk the same path for accurate AI comparison.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--spacing-2)' }}>
                {checkoutFrames.map((f, i) => (
                  <div key={i} style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)' }}>
                    <img src={f} alt={`Checkout frame ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </CardBody>
          )}
        </Card>
      )}

      {/* Video capture */}
      <Card className="section-card" style={{ borderColor: hasVideo ? 'var(--success)' : 'var(--border-light)' }}>
        <CardHeader style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          {hasVideo ? <CheckCircle2 size={18} style={{ color: 'var(--success)' }} /> : <Video size={18} style={{ color: 'var(--brand-primary)' }} />}
          <h3 className="section-title" style={{ marginBottom: 0 }}>Return Vehicle Walkthrough Video</h3>
          {isImported && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--brand-primary)', fontWeight: 'var(--font-medium)' }}>
              <Inbox size={13} /> Customer submitted
            </span>
          )}
        </CardHeader>
        <CardBody>
          {hasVideo ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--success)', fontWeight: 'var(--font-medium)' }}>
                  {frames.length} frames {isImported ? '(customer submission)' : 'captured'}
                </span>
                <Button variant="ghost" onClick={() => setVideoCaptureOpen(true)} style={{ fontSize: 'var(--text-xs)' }}>
                  <Play size={13} /> Retake
                </Button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--spacing-2)' }}>
                {frames.map((f, i) => (
                  <div key={i} style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)' }}>
                    <img src={f} alt={`Frame ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              onClick={() => setVideoCaptureOpen(true)}
              style={{ border: '2px dashed var(--border-dark)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-10)', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border-dark)')}
            >
              <Video size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--spacing-3)' }} />
              <p style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--spacing-1)' }}>Record return walkthrough</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Same path as checkout — front, sides, rear</p>
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="section-card">
        <CardHeader><h3 className="section-title">Customer Return Comments</h3></CardHeader>
        <CardBody>
          <textarea className="form-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Customer noted they might have scraped the front bumper..." />
        </CardBody>
      </Card>

      {error && (
        <div className="alert-banner" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', borderColor: 'var(--danger)' }}>
          <AlertCircle size={20} /><span>{error}</span>
        </div>
      )}

      {!hasCheckoutRef && (
        <div className="alert-banner" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
          <AlertCircle size={20} />
          <span>No checkout video found for this rental. AI comparison will be limited — staff review is recommended.</span>
        </div>
      )}

      <div className="form-actions">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Cancel</Button>
        <Button disabled={!hasVideo || loading} onClick={handleRunAi}>
          {loading
            ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> {loadingStep || 'Processing...'}</>
            : <><Cpu size={18} /> Run AI Comparison</>
          }
        </Button>
      </div>
      {!hasVideo && <p className="validation-hint">* A vehicle walkthrough video is required.</p>}
    </div>
  );
};
