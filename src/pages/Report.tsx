import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAppState, useRental } from '../lib/store';
import { Printer, Download, Archive, User, Car, PenLine } from 'lucide-react';

export const Report = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useAppState();
  const rental = useRental(id);
  const review = id ? state.finalReviews[id] : null;
  const aiResult = id ? state.aiResults[id] : null;
  const checkout = id ? state.inspections[id]?.checkout : null;

  if (!rental) {
    return <div className="animate-fade-in page-narrow"><p>Rental not found.</p></div>;
  }

  const decisionVariant = review?.decision === 'Approve Return' ? 'success' : review?.decision === 'Charge Damage Fee' ? 'danger' : 'warning';

  return (
    <div className="animate-fade-in page-narrow">
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

      {/* Shown only when printing */}
      <div className="print-header" style={{ display: 'none' }}>
        <h1 style={{ fontSize: '20pt', fontWeight: 700, marginBottom: '4pt' }}>Vehicle Inspection Report</h1>
        <p style={{ fontSize: '11pt', color: '#444' }}>
          Rental #{rental.id.toUpperCase()} &nbsp;|&nbsp; {rental.customer_name} &nbsp;|&nbsp; {rental.vehicle?.year} {rental.vehicle?.make} {rental.vehicle?.model} ({rental.vehicle?.plate_number})
        </p>
        <p style={{ fontSize: '10pt', color: '#666', marginTop: '4pt' }}>
          Printed: {new Date().toLocaleString()}
        </p>
      </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-6)' }}>
        <Card>
          <CardHeader style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <User size={18} />
            <h3 style={{ fontWeight: 'var(--font-semibold)' }}>Customer</h3>
          </CardHeader>
          <CardBody>
            <p><strong>Name:</strong> {rental.customer_name}</p>
            <p><strong>Phone:</strong> {rental.customer_phone}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Car size={18} />
            <h3 style={{ fontWeight: 'var(--font-semibold)' }}>Vehicle</h3>
          </CardHeader>
          <CardBody>
            <p><strong>Vehicle:</strong> {rental.vehicle?.year} {rental.vehicle?.make} {rental.vehicle?.model}</p>
            <p><strong>Plate:</strong> {rental.vehicle?.plate_number}</p>
          </CardBody>
        </Card>
      </div>

      <Card className="section-card">
        <CardHeader><h3 style={{ fontWeight: 'var(--font-semibold)' }}>Decision Trail</h3></CardHeader>
        <div className="table-container">
          <table className="table">
            <tbody>
              <tr>
                <td className="text-muted" style={{ width: '30%' }}>AI Recommendation</td>
                <td style={{ fontWeight: 'var(--font-medium)' }}>{aiResult ? (aiResult.summary.inspection_result === 'pass' ? 'Approve Return' : aiResult.summary.inspection_result === 'fail' ? 'Charge Damage Fee' : 'Manual Review Needed') : 'N/A'}</td>
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

      {/* Customer Signature Block */}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)' }}>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--spacing-1)' }}>Signed by</p>
                <p style={{ fontWeight: 'var(--font-semibold)' }}>{checkout.signedByName || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--spacing-1)' }}>Date &amp; Time</p>
                <p style={{ fontWeight: 'var(--font-semibold)' }}>{checkout.completedAt ? new Date(checkout.completedAt).toLocaleString() : '—'}</p>
              </div>
            </div>
            <div style={{ marginTop: 'var(--spacing-4)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', backgroundColor: '#fafafa', padding: 'var(--spacing-2)' }}>
              <img
                src={checkout.customerSignature}
                alt="Customer signature"
                style={{ maxHeight: '120px', display: 'block' }}
              />
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
