import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { VideoCapture } from '../components/ui/VideoCapture';
import { SignaturePad } from '../components/ui/SignaturePad';
import { useAppState, useRental } from '../lib/store';
import { AlertCircle, CheckCircle2, Mail, Video, Play, X } from 'lucide-react';

function buildEmailBody(params: {
  rentalId: string; customerName: string; vehicleDesc: string;
  plate: string; signedByName: string; completedAt: string; notes: string;
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
    'A full video walkthrough of the vehicle was recorded at the time of check-out. Any damage not documented above will be your responsibility upon return.',
    '',
    'If you have any questions, please contact us immediately.',
    '',
    'Thank you,',
    'Vehicle Inspection Team',
  ].join('\n');
}

interface EmailModalProps {
  email: string; body: string; link: string; onClose: () => void;
}
const EmailModal: React.FC<EmailModalProps> = ({ email, body, link, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 'var(--spacing-4)' }}>
    <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' }}>
      <div style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Mail size={20} style={{ color: 'var(--brand-primary)' }} />
            <h3 style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-lg)' }}>Send Report to Customer</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-4)' }}>
          Send the inspection summary to <strong>{email}</strong>.
        </p>
        <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-4)', fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: 'var(--spacing-5)', maxHeight: '240px', overflowY: 'auto', fontFamily: 'monospace' }}>
          {body}
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Skip</Button>
          <a href={link} onClick={onClose} style={{ textDecoration: 'none' }}>
            <Button><Mail size={15} /> Open Email Client</Button>
          </a>
        </div>
      </div>
    </div>
  </div>
);

export const CheckOut = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useAppState();
  const rental = useRental(id);

  const [frames, setFrames] = useState<string[]>([]);
  const [videoCaptureOpen, setVideoCaptureOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [signedByName, setSignedByName] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalData, setEmailModalData] = useState<{ body: string; link: string } | null>(null);

  const hasVideo = frames.length > 0;
  const isSignatureComplete = !!signature && signedByName.trim().length > 0;
  const isComplete = hasVideo && isSignatureComplete;

  const handleSubmit = () => {
    if (!id || !signature) return;
    const completedAt = new Date().toISOString();

    dispatch({
      type: 'SAVE_CHECKOUT',
      payload: {
        rentalId: id,
        data: {
          images: {},
          frames,
          notes,
          completedAt,
          customerSignature: signature,
          signedByName: signedByName.trim(),
        },
      },
    });
    dispatch({ type: 'UPDATE_RENTAL_STATUS', payload: { rentalId: id, status: 'Check-Out Completed' } });
    dispatch({ type: 'SHOW_TOAST', payload: { message: 'Check-out inspection completed and signed.', type: 'success' } });

    if (rental?.customer_email) {
      const vehicleDesc = rental.vehicle ? `${rental.vehicle.year} ${rental.vehicle.make} ${rental.vehicle.model}` : 'Vehicle';
      const body = buildEmailBody({ rentalId: id, customerName: rental.customer_name, vehicleDesc, plate: rental.vehicle?.plate_number || 'N/A', signedByName: signedByName.trim(), completedAt, notes });
      const subject = encodeURIComponent(`Vehicle Check-Out Confirmation — Rental #${id.toUpperCase()}`);
      setEmailModalData({ body, link: `mailto:${encodeURIComponent(rental.customer_email)}?subject=${subject}&body=${encodeURIComponent(body)}` });
      setShowEmailModal(true);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="animate-fade-in page-wide">
      {showEmailModal && emailModalData && rental?.customer_email && (
        <EmailModal email={rental.customer_email} body={emailModalData.body} link={emailModalData.link} onClose={() => { setShowEmailModal(false); navigate('/dashboard'); }} />
      )}
      <VideoCapture
        isOpen={videoCaptureOpen}
        onClose={() => setVideoCaptureOpen(false)}
        onFramesExtracted={setFrames}
        title="Check-Out Walkthrough"
      />

      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2 className="page-title">Check-Out Inspection</h2>
        <p className="page-subtitle">
          Rental #{id?.toUpperCase()}
          {rental && ` • ${rental.customer_name} • ${rental.vehicle?.year} ${rental.vehicle?.make} ${rental.vehicle?.model}`}
        </p>
      </div>

      <div className="alert-banner alert-banner--warning">
        <AlertCircle size={20} />
        <span>Walk slowly around the entire vehicle in a full circle. Good lighting and steady hands give the best AI results.</span>
      </div>

      {/* Step 1 — Video walkthrough */}
      <Card className="section-card" style={{ borderColor: hasVideo ? 'var(--success)' : 'var(--border-light)' }}>
        <CardHeader style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          {hasVideo ? <CheckCircle2 size={18} style={{ color: 'var(--success)' }} /> : <Video size={18} style={{ color: 'var(--brand-primary)' }} />}
          <h3 className="section-title" style={{ marginBottom: 0 }}>Step 1 — Vehicle Walkthrough Video</h3>
        </CardHeader>
        <CardBody>
          {hasVideo ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--success)', fontWeight: 'var(--font-medium)' }}>
                  <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                  {frames.length} frames captured
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
              style={{
                border: '2px dashed var(--border-dark)', borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-10)', textAlign: 'center', cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border-dark)')}
            >
              <Video size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--spacing-3)' }} />
              <p style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--spacing-1)' }}>Record vehicle walkthrough</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Walk around the entire car — front, sides, rear</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Step 2 — Existing damage notes */}
      <Card className="section-card">
        <CardHeader><h3 className="section-title">Step 2 — Existing Damage Notes</h3></CardHeader>
        <CardBody>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Note any pre-existing damage visible in the video</label>
            <textarea className="form-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Small rock chip on windshield, scratch on rear bumper..." />
          </div>
        </CardBody>
      </Card>

      {/* Step 3 — Customer signature */}
      <Card className="section-card" style={{ borderColor: isSignatureComplete ? 'var(--success)' : 'var(--border-light)' }}>
        <CardHeader style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          {isSignatureComplete ? <CheckCircle2 size={18} style={{ color: 'var(--success)' }} /> : <AlertCircle size={18} style={{ color: 'var(--warning)' }} />}
          <h3 className="section-title" style={{ marginBottom: 0 }}>Step 3 — Customer Acknowledgement</h3>
        </CardHeader>
        <CardBody>
          <div style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-3) var(--spacing-4)', marginBottom: 'var(--spacing-4)', fontSize: 'var(--text-sm)', color: 'var(--warning-text)', lineHeight: 1.6 }}>
            <strong>Statement of Condition:</strong> By signing below, the customer confirms they have reviewed the vehicle walkthrough video and acknowledges the vehicle is being received in the documented condition. Any damage not noted above will be the customer's responsibility upon return.
          </div>
          <div className="form-group">
            <label className="form-label">Customer Full Name</label>
            <input className="form-input" type="text" value={signedByName} onChange={e => setSignedByName(e.target.value)} placeholder="Type full name to confirm identity" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ marginBottom: 'var(--spacing-2)' }}>Customer Signature</label>
            <SignaturePad onSignatureChange={setSignature} />
          </div>
        </CardBody>
      </Card>

      {rental?.customer_email && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', padding: 'var(--spacing-3) var(--spacing-4)', backgroundColor: 'var(--brand-secondary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--brand-primary)', marginBottom: 'var(--spacing-4)' }}>
          <Mail size={15} />
          A report summary will be sent to <strong style={{ marginLeft: 4 }}>{rental.customer_email}</strong> after completion.
        </div>
      )}

      <div className="form-actions">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Cancel</Button>
        <Button disabled={!isComplete} onClick={handleSubmit}>Complete Check-Out Inspection</Button>
      </div>
      {!hasVideo && <p className="validation-hint">* A vehicle walkthrough video is required.</p>}
      {hasVideo && !isSignatureComplete && <p className="validation-hint">* Customer name and signature are required.</p>}
    </div>
  );
};
