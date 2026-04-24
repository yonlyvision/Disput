import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAppState, useRental } from '../lib/store';
import { REQUIRED_ANGLES } from '../lib/constants';
import { Printer, Download, Archive, User, Car, PenLine, Camera, AlertTriangle } from 'lucide-react';

export const Report = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useAppState();
  const rental = useRental(id);
  const review = id ? state.finalReviews[id] : null;
  const aiResult = id ? state.aiResults[id] : null;
  const checkout = id ? state.inspections[id]?.checkout : null;
  const checkin = id ? state.inspections[id]?.checkin : null;
  const [expandedImg, setExpandedImg] = useState<string | null>(null);

  if (!rental) {
    return <div className="animate-fade-in page-narrow"><p>Rental not found.</p></div>;
  }

  const decisionVariant =
    review?.decision === 'Approve Return' ? 'success' :
    review?.decision === 'Charge Damage Fee' ? 'danger' : 'warning';

  const allAngles = REQUIRED_ANGLES.map(a => a.angle);
  const hasCheckinPhotos = checkin && Object.keys(checkin.images ?? {}).length > 0;

  return (
    <div className="animate-fade-in page-narrow">
      {/* Lightbox */}
      {expandedImg && (
        <div
          onClick={() => setExpandedImg(null)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, cursor: 'zoom-out', padding: 'var(--spacing-4)',
          }}
        >
          <img src={expandedImg} alt="Expanded" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 'var(--radius-lg)' }} />
        </div>
      )}

      <div className="page-header">
        <div>
          <h2 className="page-title">Inspection Report</h2>
          <p className="page-subtitle">Rental #{rental.id.toUpperCase()}</p>
        </div>
        <div className="action-buttons">
          <Button variant="secondary" onClick={() => window.print()}><Printer size={16} /> Print</Button>
          <Button variant="secondary" onClick={() => window.print()}><Download size={16} /> PDF</Button>
          <Button variant="secondary"><Archive size={16} /> Archive</Button>
        </div>
      </div>

      {/* Print-only header */}
      <div className="print-header" style={{ display: 'none' }}>
        <h1 style={{ fontSize: '20pt', fontWeight: 700, marginBottom: '4pt' }}>Vehicle Inspection Report</h1>
        <p style={{ fontSize: '11pt', color: '#444' }}>
          Rental #{rental.id.toUpperCase()} &nbsp;|&nbsp; {rental.customer_name} &nbsp;|&nbsp;{' '}
          {rental.vehicle?.year} {rental.vehicle?.make} {rental.vehicle?.model} ({rental.vehicle?.plate_number})
        </p>
        <p style={{ fontSize: '10pt', color: '#666', marginTop: '4pt' }}>Printed: {new Date().toLocaleString()}</p>
      </div>

      {/* Final status */}
      <Card className="section-card">
        <CardBody style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
          <div>
            <h3 className="text-muted">Final Status</h3>
            <Badge variant={decisionVariant} style={{ fontSize: 'var(--text-base)', padding: 'var(--spacing-1) var(--spacing-3)', marginTop: 'var(--spacing-1)' }}>
              {review?.decision || 'Pending Review'}
            </Badge>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 className="text-muted">Closed On</h3>
            <p style={{ fontWeight: 'var(--font-medium)' }}>{review ? new Date(review.timestamp).toLocaleString() : 'N/A'}</p>
          </div>
        </CardBody>
      </Card>

      {/* Customer + Vehicle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-6)' }}>
        <Card>
          <CardHeader style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <User size={18} /><h3 style={{ fontWeight: 'var(--font-semibold)' }}>Customer</h3>
          </CardHeader>
          <CardBody>
            <p><strong>Name:</strong> {rental.customer_name}</p>
            <p><strong>Phone:</strong> {rental.customer_phone}</p>
            {rental.customer_email && <p><strong>Email:</strong> {rental.customer_email}</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Car size={18} /><h3 style={{ fontWeight: 'var(--font-semibold)' }}>Vehicle</h3>
          </CardHeader>
          <CardBody>
            <p><strong>Vehicle:</strong> {rental.vehicle?.year} {rental.vehicle?.make} {rental.vehicle?.model}</p>
            <p><strong>Plate:</strong> {rental.vehicle?.plate_number}</p>
            <p><strong>Rental period:</strong> {new Date(rental.start_date).toLocaleDateString()} — {new Date(rental.expected_return_date).toLocaleDateString()}</p>
          </CardBody>
        </Card>
      </div>

      {/* Checkout photos */}
      {checkout && Object.keys(checkout.images ?? {}).length > 0 && (
        <Card className="section-card">
          <CardHeader style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Camera size={18} />
            <h3 style={{ fontWeight: 'var(--font-semibold)' }}>
              {hasCheckinPhotos ? 'Photo Comparison (Check-Out vs Check-In)' : 'Check-Out Photos'}
            </h3>
          </CardHeader>
          <CardBody>
            {checkout.notes && (
              <div style={{
                backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning)',
                borderRadius: 'var(--radius-md)', padding: 'var(--spacing-3)',
                fontSize: 'var(--text-sm)', color: 'var(--warning-text)',
                marginBottom: 'var(--spacing-4)',
              }}>
                <strong>Pre-existing damage noted at checkout:</strong> {checkout.notes}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-4)' }}>
              {allAngles.map(angle => {
                const coImg = checkout.images?.[angle];
                const ciImg = checkin?.images?.[angle];
                const isFlagged = aiResult?.damages.some(d =>
                  d.side.toLowerCase().includes(angle.toLowerCase().split(' ')[0].split('-')[0])
                );
                if (!coImg && !ciImg) return null;
                return (
                  <div key={angle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>{angle}</span>
                      {isFlagged && <Badge variant="danger"><AlertTriangle size={11} style={{ marginRight: 4 }} />Flagged</Badge>}
                    </div>
                    {hasCheckinPhotos ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-1)' }}>
                        {[{ label: 'Out', img: coImg }, { label: 'In', img: ciImg }].map(({ label, img }) => (
                          <div key={label}>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>Check-{label}</span>
                            <div
                              onClick={() => img && setExpandedImg(img)}
                              style={{
                                height: '110px', backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)', overflow: 'hidden',
                                cursor: img ? 'zoom-in' : 'default',
                                border: isFlagged && label === 'In' ? '2px solid var(--danger)' : '2px solid transparent',
                              }}
                            >
                              {img
                                ? <img src={img} alt={`${angle} check-${label}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>No image</div>
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        onClick={() => coImg && setExpandedImg(coImg)}
                        style={{
                          height: '160px', backgroundColor: 'var(--bg-tertiary)',
                          borderRadius: 'var(--radius-md)', overflow: 'hidden',
                          cursor: coImg ? 'zoom-in' : 'default',
                        }}
                      >
                        {coImg
                          ? <img src={coImg} alt={angle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>No image</div>
                        }
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* AI findings */}
      {aiResult && (
        <Card className="section-card">
          <CardHeader style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <AlertTriangle size={18} />
            <h3 style={{ fontWeight: 'var(--font-semibold)' }}>AI Damage Findings</h3>
            <Badge variant={aiResult.summary.inspection_result === 'pass' ? 'success' : aiResult.summary.inspection_result === 'fail' ? 'danger' : 'warning'} style={{ marginLeft: 'auto' }}>
              {aiResult.summary.inspection_result === 'pass' ? 'Pass' : aiResult.summary.inspection_result === 'fail' ? 'Damage Detected' : 'Needs Review'} — {aiResult.summary.overall_confidence}% confidence
            </Badge>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            {aiResult.damages.length === 0 ? (
              <p style={{ padding: 'var(--spacing-4)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>No new damage detected by AI.</p>
            ) : (
              aiResult.damages.map((d, i) => (
                <div key={i} style={{ padding: 'var(--spacing-4)', borderBottom: i < aiResult.damages.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-1)', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
                    <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>{d.panel_or_area} — {d.side}</span>
                    <Badge variant={d.severity === 'major' ? 'danger' : d.severity === 'moderate' ? 'warning' : 'default'}>{d.severity} {d.damage_type}</Badge>
                  </div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{d.description}</p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      )}

      {/* Decision trail */}
      <Card className="section-card">
        <CardHeader><h3 style={{ fontWeight: 'var(--font-semibold)' }}>Decision Trail</h3></CardHeader>
        <div className="table-container">
          <table className="table">
            <tbody>
              <tr>
                <td className="text-muted" style={{ width: '30%' }}>AI Recommendation</td>
                <td style={{ fontWeight: 'var(--font-medium)' }}>
                  {aiResult ? (aiResult.summary.inspection_result === 'pass' ? 'Approve Return' : aiResult.summary.inspection_result === 'fail' ? 'Charge Damage Fee' : 'Manual Review Needed') : 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="text-muted">Staff Decision</td>
                <td>
                  <strong>{review?.decision || 'N/A'}</strong>
                  {review && <span className="text-muted" style={{ marginLeft: 'var(--spacing-2)' }}>by {review.reviewer}</span>}
                </td>
              </tr>
              <tr>
                <td className="text-muted">Reviewer Notes</td>
                <td style={{ fontStyle: 'italic' }}>"{review?.notes || 'No notes provided.'}"</td>
              </tr>
              <tr>
                <td className="text-muted">Decision Timestamp</td>
                <td>{review ? new Date(review.timestamp).toLocaleString() : 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Customer signature */}
      {checkout?.customerSignature && (
        <Card className="section-card">
          <CardHeader style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <PenLine size={18} />
            <h3 style={{ fontWeight: 'var(--font-semibold)' }}>Customer Acknowledgement</h3>
          </CardHeader>
          <CardBody>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-3)' }}>
              By signing below, the customer confirmed receipt of the vehicle in the documented condition at checkout.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-4)' }}>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--spacing-1)' }}>Signed by</p>
                <p style={{ fontWeight: 'var(--font-semibold)' }}>{checkout.signedByName || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--spacing-1)' }}>Date &amp; Time</p>
                <p style={{ fontWeight: 'var(--font-semibold)' }}>{checkout.completedAt ? new Date(checkout.completedAt).toLocaleString() : '—'}</p>
              </div>
            </div>
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', backgroundColor: '#fafafa', padding: 'var(--spacing-2)' }}>
              <img src={checkout.customerSignature} alt="Customer signature" style={{ maxHeight: '120px', display: 'block' }} />
            </div>
          </CardBody>
        </Card>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-8)' }}>
        <Button onClick={() => navigate('/dashboard')} variant="ghost">Return to Dashboard</Button>
      </div>
    </div>
  );
};
