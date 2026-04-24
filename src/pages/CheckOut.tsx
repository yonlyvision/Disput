import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ImageUploadCard } from '../components/ui/ImageUploadCard';
import { SignaturePad } from '../components/ui/SignaturePad';
import { REQUIRED_ANGLES } from '../lib/constants';
import { useAppState, useRental } from '../lib/store';
import type { VehicleAngle } from '../types';
import { AlertCircle, CheckCircle2, Mail, X } from 'lucide-react';

// ── Email helpers ────────────────────────────────────────────

function buildEmailBody(params: {
  rentalId: string;
  customerName: string;
  vehicleDesc: string;
  plate: string;
  signedByName: string;
  completedAt: string;
  notes: string;
}): string {
  const { rentalId, customerName, vehicleDesc, plate, signedByName, completedAt, notes } = params;
  return [
    `Dear ${customerName},`,
    '',
    `This email confirms your vehicle check-out for rental #${rentalId.toUpperCase()}.`,
    '',
    `Vehicle: ${vehicleDesc}`,
    `Plate: ${plate}`,
    `Check-out time: ${new Date(completedAt).toLocaleString()}`,
    `Signed by: ${signedByName}`,
    '',
    notes ? `Pre-existing damage on file:\n${notes}` : 'No pre-existing damage noted.',
    '',
    'All vehicle photos taken at the time of check-out are on file. Any damage not documented above will be your responsibility upon return.',
    '',
    'If you have any questions, please contact us immediately.',
    '',
    'Thank you,',
    'Vehicle Inspection Team',
  ].join('\n');
}

function buildMailtoLink(to: string, rentalId: string, body: string): string {
  const subject = encodeURIComponent(`Vehicle Check-Out Confirmation — Rental #${rentalId.toUpperCase()}`);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${encodedBody}`;
}

// ── Email Modal ──────────────────────────────────────────────

interface EmailModalProps {
  email: string;
  emailBody: string;
  mailtoLink: string;
  onClose: () => void;
}

const EmailModal: React.FC<EmailModalProps> = ({ email, emailBody, mailtoLink, onClose }) => (
  <div
    style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 'var(--spacing-4)',
    }}
  >
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '560px',
        maxHeight: '90vh', overflow: 'auto',
      }}
    >
      <div style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Mail size={20} style={{ color: 'var(--brand-primary)' }} />
            <h3 style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-lg)' }}>Send Report to Customer</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-4)' }}>
          Send the inspection summary to <strong>{email}</strong>. This gives the customer a record of the vehicle condition at pick-up.
        </p>

        <div
          style={{
            backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)', padding: 'var(--spacing-4)',
            fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap', lineHeight: 1.7,
            color: 'var(--text-primary)', marginBottom: 'var(--spacing-5)',
            maxHeight: '260px', overflowY: 'auto', fontFamily: 'monospace',
          }}
        >
          {emailBody}
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Skip</Button>
          <a href={mailtoLink} onClick={onClose} style={{ textDecoration: 'none' }}>
            <Button>
              <Mail size={15} /> Open Email Client
            </Button>
          </a>
        </div>
      </div>
    </div>
  </div>
);

// ── CheckOut page ────────────────────────────────────────────

export const CheckOut = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useAppState();
  const rental = useRental(id);

  const [images, setImages] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [signedByName, setSignedByName] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalData, setEmailModalData] = useState<{ body: string; link: string } | null>(null);

  const handleImageCapture = (angle: VehicleAngle, _file: File | null, previewUrl: string) => {
    setImages(prev => ({ ...prev, [angle]: previewUrl }));
  };

  const completedCount = REQUIRED_ANGLES.filter(a => images[a.angle]).length;
  const isPhotosComplete = completedCount === REQUIRED_ANGLES.length;
  const isSignatureComplete = !!signature && signedByName.trim().length > 0;
  const isComplete = isPhotosComplete && isSignatureComplete;

  const handleSubmit = () => {
    if (!id || !signature) return;

    const completedAt = new Date().toISOString();

    dispatch({
      type: 'SAVE_CHECKOUT',
      payload: {
        rentalId: id,
        data: {
          images,
          notes,
          completedAt,
          customerSignature: signature,
          signedByName: signedByName.trim(),
        },
      },
    });
    dispatch({ type: 'UPDATE_RENTAL_STATUS', payload: { rentalId: id, status: 'Check-Out Completed' } });
    dispatch({ type: 'SHOW_TOAST', payload: { message: 'Check-out inspection completed and signed.', type: 'success' } });

    // If rental has an email, show the email modal before navigating
    if (rental?.customer_email) {
      const vehicleDesc = rental.vehicle
        ? `${rental.vehicle.year} ${rental.vehicle.make} ${rental.vehicle.model}`
        : 'Vehicle';
      const plate = rental.vehicle?.plate_number || 'N/A';
      const body = buildEmailBody({
        rentalId: id,
        customerName: rental.customer_name,
        vehicleDesc,
        plate,
        signedByName: signedByName.trim(),
        completedAt,
        notes,
      });
      const link = buildMailtoLink(rental.customer_email, id, body);
      setEmailModalData({ body, link });
      setShowEmailModal(true);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="animate-fade-in page-wide">
      {showEmailModal && emailModalData && rental?.customer_email && (
        <EmailModal
          email={rental.customer_email}
          emailBody={emailModalData.body}
          mailtoLink={emailModalData.link}
          onClose={() => { setShowEmailModal(false); navigate('/dashboard'); }}
        />
      )}

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

      {/* Step 1 — Required Angles */}
      <div className="section-header">
        <h3 className="section-title">Step 1 — Vehicle Photos</h3>
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

      {/* Step 2 — Existing Damage Notes */}
      <Card className="section-card">
        <CardHeader><h3 className="section-title">Step 2 — Existing Damage Notes</h3></CardHeader>
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

      {/* Step 3 — Customer Signature */}
      <Card className="section-card" style={{ borderColor: isSignatureComplete ? 'var(--success)' : 'var(--border-light)' }}>
        <CardHeader style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          {isSignatureComplete
            ? <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
            : <AlertCircle size={18} style={{ color: 'var(--warning)' }} />
          }
          <h3 className="section-title" style={{ marginBottom: 0 }}>Step 3 — Customer Acknowledgement</h3>
        </CardHeader>
        <CardBody>
          <div
            style={{
              backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning)',
              borderRadius: 'var(--radius-md)', padding: 'var(--spacing-3) var(--spacing-4)',
              marginBottom: 'var(--spacing-4)', fontSize: 'var(--text-sm)',
              color: 'var(--warning-text)', lineHeight: 1.6,
            }}
          >
            <strong>Statement of Condition:</strong> By signing below, the customer confirms that they have reviewed the vehicle photos and notes above, and acknowledges the vehicle is being received in the documented condition. Any damage not noted above will be the customer's responsibility upon return.
          </div>

          <div className="form-group">
            <label className="form-label">Customer Full Name</label>
            <input
              className="form-input"
              type="text"
              value={signedByName}
              onChange={e => setSignedByName(e.target.value)}
              placeholder="Type full name to confirm identity"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ marginBottom: 'var(--spacing-2)' }}>Customer Signature</label>
            <SignaturePad onSignatureChange={setSignature} />
          </div>
        </CardBody>
      </Card>

      {rental?.customer_email && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)',
            padding: 'var(--spacing-3) var(--spacing-4)',
            backgroundColor: 'var(--brand-secondary)', borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)', color: 'var(--brand-primary)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          <Mail size={15} />
          A report summary will be sent to <strong style={{ marginLeft: 4 }}>{rental.customer_email}</strong> after completion.
        </div>
      )}

      <div className="form-actions">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Cancel</Button>
        <Button disabled={!isComplete} onClick={handleSubmit}>
          Complete Check-Out Inspection
        </Button>
      </div>
      {!isPhotosComplete && (
        <p className="validation-hint">* All {REQUIRED_ANGLES.length} required angles must be captured before submitting.</p>
      )}
      {isPhotosComplete && !isSignatureComplete && (
        <p className="validation-hint">* Customer name and signature are required before submitting.</p>
      )}
    </div>
  );
};
