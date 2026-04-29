import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAppState, useRental } from '../lib/store';
import { AlertTriangle, CheckCircle, Info, Video, X } from 'lucide-react';
import type { FinalDecision } from '../types';

export const AiReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useAppState();
  const rental = useRental(id);
  const aiData = id ? state.aiResults[id] : null;
  const inspections = id ? state.inspections[id] : null;

  const [decision, setDecision] = useState<FinalDecision | null>(null);
  const [notes, setNotes] = useState('');
  const [expandedImg, setExpandedImg] = useState<string | null>(null);

  const checkoutFrames = inspections?.checkout?.frames ?? [];
  const checkinFrames = inspections?.checkin?.frames ?? [];

  if (!aiData) {
    return (
      <div className="animate-fade-in page-wide">
        <p>No AI results found for this rental. Please complete the check-in inspection first.</p>
      </div>
    );
  }

  const handleFinalize = () => {
    if (!id || !decision) return;
    dispatch({
      type: 'SAVE_FINAL_REVIEW',
      payload: { rentalId: id, data: { decision, notes, reviewer: 'Staff', timestamp: new Date().toISOString() } },
    });
    dispatch({ type: 'UPDATE_RENTAL_STATUS', payload: { rentalId: id, status: 'Completed' } });
    dispatch({ type: 'SHOW_TOAST', payload: { message: 'Inspection finalized.', type: 'success' } });
    navigate(`/rentals/${id}/report`);
  };

  return (
    <div className="animate-fade-in page-wide">
      {/* Lightbox */}
      {expandedImg && (
        <div
          onClick={() => setExpandedImg(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out', padding: 'var(--spacing-4)' }}
        >
          <button onClick={() => setExpandedImg(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={28} />
          </button>
          <img src={expandedImg} alt="Expanded frame" style={{ maxWidth: '92vw', maxHeight: '92vh', borderRadius: 'var(--radius-lg)' }} />
        </div>
      )}

      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2 className="page-title">AI Comparison Results</h2>
        <p className="page-subtitle">Rental #{id?.toUpperCase()}{rental && ` • ${rental.customer_name}`}</p>
      </div>

      {/* Summary + Findings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-6)' }}>
        <Card style={{ alignSelf: 'start' }}>
          <CardHeader><h3 className="section-title">AI Summary</h3></CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div>
                <span className="text-muted">Result</span>
                <div style={{ marginTop: 'var(--spacing-1)' }}>
                  {aiData.summary.inspection_result === 'pass' && <Badge variant="success">Pass — No Damage</Badge>}
                  {aiData.summary.inspection_result === 'review' && <Badge variant="warning">Needs Review</Badge>}
                  {aiData.summary.inspection_result === 'fail' && <Badge variant="danger">Damage Detected</Badge>}
                </div>
              </div>
              <div>
                <span className="text-muted">New Damage</span>
                <p style={{ fontWeight: 'var(--font-medium)' }}>{aiData.summary.new_damage_detected ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="text-muted">Confidence</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${aiData.summary.overall_confidence}%`, height: '100%',
                      backgroundColor: aiData.summary.inspection_result === 'pass' ? 'var(--success)' : aiData.summary.inspection_result === 'fail' ? 'var(--danger)' : 'var(--warning)',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{aiData.summary.overall_confidence}%</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h3 className="section-title">Findings ({aiData.damages.length})</h3></CardHeader>
          <CardBody style={{ padding: 0 }}>
            {aiData.damages.length === 0 ? (
              <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <CheckCircle size={32} style={{ margin: '0 auto var(--spacing-2)', color: 'var(--success)' }} />
                <p>No new damage detected.</p>
              </div>
            ) : (
              aiData.damages.map((damage, idx) => (
                <div key={idx} style={{ padding: 'var(--spacing-4)', borderBottom: idx < aiData.damages.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
                    <h4 style={{ fontWeight: 'var(--font-medium)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                      <AlertTriangle size={16} color="var(--warning)" />
                      {damage.panel_or_area} — {damage.side}
                    </h4>
                    <Badge variant={damage.severity === 'major' ? 'danger' : damage.severity === 'moderate' ? 'warning' : 'default'}>
                      {damage.severity} {damage.damage_type}
                    </Badge>
                  </div>
                  <p className="text-muted" style={{ marginBottom: 'var(--spacing-2)' }}>{damage.description}</p>
                  <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: 'var(--spacing-2)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}>
                    <strong>AI Reasoning:</strong> {damage.reasoning}
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* Unreviewable areas */}
      {aiData.unreviewable_areas.length > 0 && (
        <div className="alert-banner" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', marginBottom: 'var(--spacing-6)' }}>
          <Info size={20} style={{ color: 'var(--text-secondary)' }} />
          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Areas AI Could Not Review</h4>
            <ul style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-1)', listStyle: 'disc', paddingLeft: 'var(--spacing-4)' }}>
              {aiData.unreviewable_areas.map((area, idx) => (
                <li key={idx}><strong>{area.panel_or_area}:</strong> {area.reason}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Frame comparison */}
      {(checkoutFrames.length > 0 || checkinFrames.length > 0) && (
        <Card className="section-card">
          <CardHeader style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Video size={18} />
            <h3 className="section-title" style={{ marginBottom: 0 }}>Walkthrough Frame Comparison</h3>
            <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Click any frame to expand</span>
          </CardHeader>
          <CardBody>
            {checkoutFrames.length > 0 && (
              <div style={{ marginBottom: checkinFrames.length > 0 ? 'var(--spacing-6)' : 0 }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-3)' }}>
                  Check-Out — {checkoutFrames.length} frames (baseline)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--spacing-2)' }}>
                  {checkoutFrames.map((f, i) => (
                    <div key={i} onClick={() => setExpandedImg(f)} style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)', cursor: 'zoom-in', border: '2px solid var(--border-light)' }}>
                      <img src={f} alt={`Checkout ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {checkinFrames.length > 0 && (
              <div>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: aiData.summary.inspection_result === 'fail' ? 'var(--danger-text)' : 'var(--text-secondary)', marginBottom: 'var(--spacing-3)' }}>
                  Check-In — {checkinFrames.length} frames (returned)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--spacing-2)' }}>
                  {checkinFrames.map((f, i) => (
                    <div key={i} onClick={() => setExpandedImg(f)} style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)', cursor: 'zoom-in', border: `2px solid ${aiData.summary.inspection_result === 'fail' ? 'var(--danger)' : 'var(--border-light)'}` }}>
                      <img src={f} alt={`Checkin ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Staff Final Decision */}
      <Card style={{ borderColor: 'var(--brand-primary)' }}>
        <CardHeader style={{ backgroundColor: 'var(--brand-secondary)' }}>
          <h3 className="section-title" style={{ color: 'var(--brand-primary)' }}>Staff Final Decision</h3>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
            {(['Approve Return', 'Manual Review', 'Charge Damage Fee'] as FinalDecision[]).map(opt => (
              <Button
                key={opt}
                variant={decision === opt ? 'primary' : 'secondary'}
                onClick={() => setDecision(opt)}
                style={
                  decision === opt && opt === 'Manual Review' ? { backgroundColor: 'var(--warning)', borderColor: 'var(--warning)', color: 'white' } :
                  decision === opt && opt === 'Charge Damage Fee' ? { backgroundColor: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' } : undefined
                }
              >
                {opt}
              </Button>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">Reviewer Notes (Optional)</label>
            <textarea className="form-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add final remarks..." />
          </div>
          <div className="form-actions">
            <Button disabled={!decision} onClick={handleFinalize}>Finalize Inspection</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
