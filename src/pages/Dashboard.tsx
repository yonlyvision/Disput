import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, type BadgeVariant } from '../components/ui/Badge';
import { useAppState } from '../lib/store';
import { fetchAllPendingSubmissions, markSubmissionImported, isSupabaseConfigured, type CustomerSubmission } from '../lib/submissions';
import type { RentalStatus } from '../types';
import { Plus, Play, CheckCircle, FileText, RefreshCw, Link2, X, Camera, ArrowRight, Inbox } from 'lucide-react';

const getStatusBadgeVariant = (status: RentalStatus): BadgeVariant => {
  switch (status) {
    case 'Draft': return 'default';
    case 'Check-Out Completed': return 'brand';
    case 'Awaiting Return': return 'warning';
    case 'Check-In Submitted': return 'brand';
    case 'AI Review Ready': return 'danger';
    case 'Manual Review Needed': return 'warning';
    case 'Completed': return 'success';
    default: return 'default';
  }
};

// ── Share Link Modal ─────────────────────────────────────────

interface ShareModalProps {
  rentalId: string;
  vehicleLabel: string;
  captureType: 'checkout' | 'checkin';
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ rentalId, vehicleLabel, captureType, onClose }) => {
  const [copied, setCopied] = useState(false);
  const baseUrl = window.location.origin;
  const url = `${baseUrl}/capture/${rentalId}?v=${encodeURIComponent(vehicleLabel)}&type=${captureType}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=220x220&margin=10`;

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 'var(--spacing-4)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '400px', overflow: 'auto',
        }}
      >
        <div style={{ padding: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
            <div>
              <h3 style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-lg)' }}>
                Share Inspection Link
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {captureType === 'checkout' ? 'Pick-up' : 'Return'} · Rental #{rentalId.toUpperCase()}
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>

          {/* QR Code */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-4)' }}>
            <img
              src={qrUrl}
              alt="QR code"
              style={{ width: 220, height: 220, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
            />
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--spacing-2)' }}>
              Customer scans this with their phone camera
            </p>
          </div>

          {/* Link copy */}
          <div style={{
            display: 'flex', gap: 'var(--spacing-2)',
            backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-2) var(--spacing-3)',
            marginBottom: 'var(--spacing-4)',
          }}>
            <span style={{
              fontSize: 'var(--text-xs)', color: 'var(--text-secondary)',
              flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center',
            }}>
              {url}
            </span>
            <Button variant="secondary" onClick={copy} style={{ padding: '4px 10px', fontSize: 'var(--text-xs)', flexShrink: 0 }}>
              {copied ? '✓ Copied' : 'Copy'}
            </Button>
          </div>

          <div style={{
            backgroundColor: 'var(--brand-secondary)', borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-3)', fontSize: 'var(--text-xs)', color: 'var(--brand-primary)', lineHeight: 1.6,
          }}>
            <strong>How it works:</strong> Customer opens the link, takes photos from all required angles,
            and submits. You'll see their photos appear in the Dashboard under "Pending Submissions."
            Photos are permanent once submitted — they cannot be declined or removed.
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Submission Viewer Modal ──────────────────────────────────

interface ViewSubmissionModalProps {
  submission: CustomerSubmission;
  onImport: () => void;
  onClose: () => void;
}

const ViewSubmissionModal: React.FC<ViewSubmissionModalProps> = ({ submission, onImport, onClose }) => {
  // Sort frame_0, frame_1, ... numerically and build an ordered array
  const frames = Object.keys(submission.images)
    .filter(k => k.startsWith('frame_'))
    .sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]))
    .map(k => submission.images[k]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 'var(--spacing-4)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '640px',
          maxHeight: '90vh', overflow: 'auto',
        }}
      >
        <div style={{ padding: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
            <div>
              <h3 style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-lg)' }}>Customer Video Frames</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Rental #{submission.rental_id.toUpperCase()} · {frames.length} frames · submitted {new Date(submission.submitted_at).toLocaleString()} by {submission.submitted_by}
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>

          {submission.notes && (
            <div style={{
              backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning)',
              borderRadius: 'var(--radius-md)', padding: 'var(--spacing-3)',
              fontSize: 'var(--text-sm)', color: 'var(--warning-text)', marginBottom: 'var(--spacing-4)',
            }}>
              <strong>Customer note:</strong> {submission.notes}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-5)' }}>
            {frames.map((f, i) => (
              <div key={i} style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)' }}>
                <img src={f} alt={`Frame ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <Button onClick={onImport}>
              <ArrowRight size={16} /> Use as Check-In Frames
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Dashboard ────────────────────────────────────────────────

export const Dashboard = () => {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const rentals = state.rentals;

  const [shareModal, setShareModal] = useState<{ rentalId: string; vehicleLabel: string; captureType: 'checkout' | 'checkin' } | null>(null);
  const [pendingSubmissions, setPendingSubmissions] = useState<CustomerSubmission[]>([]);
  const [viewSubmission, setViewSubmission] = useState<CustomerSubmission | null>(null);

  const activeRentals = rentals.filter(r => r.status !== 'Completed').length;
  const awaitingReturn = rentals.filter(r => r.status === 'Check-Out Completed' || r.status === 'Awaiting Return').length;
  const needsReview = rentals.filter(r => r.status === 'AI Review Ready' || r.status === 'Manual Review Needed').length;
  const completed = rentals.filter(r => r.status === 'Completed').length;

  // Poll for pending submissions every 15s when Supabase is configured
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const load = () => fetchAllPendingSubmissions().then(setPendingSubmissions);
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const openShareModal = (rentalId: string, vehicleLabel: string, captureType: 'checkout' | 'checkin') => {
    setShareModal({ rentalId, vehicleLabel, captureType });
  };

  const handleImportSubmission = async (submission: CustomerSubmission) => {
    // Convert frame_0, frame_1, ... dict → ordered string[] for the video-based flow
    const frames = Object.keys(submission.images)
      .filter(k => k.startsWith('frame_'))
      .sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]))
      .map(k => submission.images[k]);

    dispatch({
      type: 'SAVE_CHECKIN',
      payload: {
        rentalId: submission.rental_id,
        data: {
          images: {},
          frames,
          notes: submission.notes || '',
          completedAt: submission.submitted_at,
        },
      },
    });
    dispatch({ type: 'UPDATE_RENTAL_STATUS', payload: { rentalId: submission.rental_id, status: 'Check-In Submitted' } });
    await markSubmissionImported(submission.id);
    setPendingSubmissions(prev => prev.filter(s => s.id !== submission.id));
    setViewSubmission(null);
    dispatch({ type: 'SHOW_TOAST', payload: { message: 'Customer frames imported. Proceed to Check-In to run AI comparison.', type: 'info' } });
    navigate(`/rentals/${submission.rental_id}/checkin`);
  };

  return (
    <div className="animate-fade-in">
      {shareModal && (
        <ShareModal
          rentalId={shareModal.rentalId}
          vehicleLabel={shareModal.vehicleLabel}
          captureType={shareModal.captureType}
          onClose={() => setShareModal(null)}
        />
      )}
      {viewSubmission && (
        <ViewSubmissionModal
          submission={viewSubmission}
          onImport={() => handleImportSubmission(viewSubmission)}
          onClose={() => setViewSubmission(null)}
        />
      )}

      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Manage your active rentals and inspections.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="ghost" onClick={() => dispatch({ type: 'RESET_STATE' })} style={{ color: 'var(--text-tertiary)' }}>
            <RefreshCw size={18} /> Reset Data
          </Button>
          <Link to="/rentals/new">
            <Button><Plus size={18} /> Create New Rental</Button>
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="summary-grid">
        <Card className="summary-card">
          <CardBody><h3 className="summary-label">Active Rentals</h3><p className="summary-value">{activeRentals}</p></CardBody>
        </Card>
        <Card className="summary-card summary-card--warning">
          <CardBody><h3 className="summary-label">Awaiting Return</h3><p className="summary-value">{awaitingReturn}</p></CardBody>
        </Card>
        <Card className="summary-card summary-card--danger">
          <CardBody>
            <h3 className="summary-label">Needs Review</h3>
            <p className="summary-value" style={{ color: needsReview > 0 ? 'var(--danger)' : undefined }}>{needsReview}</p>
          </CardBody>
        </Card>
        <Card className="summary-card summary-card--success">
          <CardBody><h3 className="summary-label">Completed</h3><p className="summary-value">{completed}</p></CardBody>
        </Card>
      </div>

      {/* Pending customer submissions */}
      {pendingSubmissions.length > 0 && (
        <Card className="section-card" style={{ borderColor: 'var(--brand-primary)', backgroundColor: 'var(--brand-secondary)' }}>
          <CardHeader style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', backgroundColor: 'var(--brand-secondary)' }}>
            <Inbox size={18} style={{ color: 'var(--brand-primary)' }} />
            <h3 style={{ fontWeight: 'var(--font-semibold)', color: 'var(--brand-primary)' }}>
              Pending Customer Submissions ({pendingSubmissions.length})
            </h3>
          </CardHeader>
          <CardBody style={{ backgroundColor: 'var(--bg-secondary)', padding: 0 }}>
            {pendingSubmissions.map((sub, i) => (
              <div
                key={sub.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--spacing-4)', flexWrap: 'wrap', gap: 'var(--spacing-3)',
                  borderBottom: i < pendingSubmissions.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                  <Camera size={18} style={{ color: 'var(--brand-primary)' }} />
                  <div>
                    <p style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
                      Rental #{sub.rental_id.toUpperCase()} — {Object.keys(sub.images).length} frames
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      Submitted by {sub.submitted_by} · {new Date(sub.submitted_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setViewSubmission(sub)}>
                  View Photos
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Rentals table */}
      <Card>
        <CardHeader>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Recent Rentals</h3>
        </CardHeader>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Rental ID</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Dates</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map(rental => {
                const vehicleLabel = rental.vehicle
                  ? `${rental.vehicle.year} ${rental.vehicle.make} ${rental.vehicle.model}`
                  : 'Vehicle';
                const captureType = rental.status === 'Draft' ? 'checkout' : 'checkin';
                const hasPending = pendingSubmissions.some(s => s.rental_id === rental.id);

                return (
                  <tr key={rental.id}>
                    <td style={{ fontWeight: 'var(--font-medium)' }}>{rental.id.toUpperCase()}</td>
                    <td>{rental.customer_name}</td>
                    <td>
                      {rental.vehicle?.year} {rental.vehicle?.make} {rental.vehicle?.model}
                      <br /><span className="text-muted">{rental.vehicle?.plate_number}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <Badge variant={getStatusBadgeVariant(rental.status)}>{rental.status}</Badge>
                        {hasPending && <Badge variant="brand"><Camera size={10} style={{ marginRight: 3 }} />Photos Pending</Badge>}
                      </div>
                    </td>
                    <td>
                      <div className="text-muted">
                        Out: {new Date(rental.start_date).toLocaleDateString()}<br />
                        In: {rental.actual_return_date ? new Date(rental.actual_return_date).toLocaleDateString() : 'Pending'}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons" style={{ flexWrap: 'wrap' }}>
                        {/* Share link — available for all non-completed rentals */}
                        {rental.status !== 'Completed' && (
                          <Button
                            variant="ghost"
                            onClick={() => openShareModal(rental.id, vehicleLabel, captureType)}
                            style={{ color: 'var(--brand-primary)', padding: '4px 8px' }}
                          >
                            <Link2 size={15} /> Share
                          </Button>
                        )}
                        {rental.status === 'Draft' && (
                          <Link to={`/rentals/${rental.id}/checkout`}>
                            <Button variant="secondary"><Play size={16} /> Check-Out</Button>
                          </Link>
                        )}
                        {(rental.status === 'Check-Out Completed' || rental.status === 'Awaiting Return' || rental.status === 'Check-In Submitted') && (
                          <Link to={`/rentals/${rental.id}/checkin`}>
                            <Button variant="secondary"><CheckCircle size={16} /> Check-In</Button>
                          </Link>
                        )}
                        {(rental.status === 'AI Review Ready' || rental.status === 'Manual Review Needed') && (
                          <Link to={`/rentals/${rental.id}/review`}>
                            <Button variant="primary">Review AI</Button>
                          </Link>
                        )}
                        {rental.status === 'Completed' && (
                          <Link to={`/rentals/${rental.id}/report`}>
                            <Button variant="secondary"><FileText size={16} /> Report</Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
