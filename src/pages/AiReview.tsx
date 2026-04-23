import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { mockAiResponses, mockRentals } from '../lib/mockData';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { FinalDecision } from '../types';

export const AiReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const rental = mockRentals.find(r => r.id === id) || mockRentals[1]; // fallback to r2
  
  // For demo, we use the possibleDamage mock
  const aiData = mockAiResponses.possibleDamage;

  const [decision, setDecision] = useState<FinalDecision | null>(null);
  const [notes, setNotes] = useState('');

  const handleFinalize = () => {
    // In a real app, this submits the final decision and updates the rental status to Completed
    navigate(`/rentals/${id || rental.id}/report`);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--spacing-1)' }}>AI Comparison Results</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Review AI findings for Rental #{rental.id.toUpperCase()}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-6)' }}>
        {/* AI Summary Card */}
        <Card style={{ alignSelf: 'start' }}>
          <CardHeader>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>AI Summary</h3>
          </CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Result</span>
                <div style={{ marginTop: 'var(--spacing-1)' }}>
                  {aiData.summary.inspection_result === 'pass' && <Badge variant="success">Pass</Badge>}
                  {aiData.summary.inspection_result === 'review' && <Badge variant="warning">Needs Review</Badge>}
                  {aiData.summary.inspection_result === 'fail' && <Badge variant="danger">Damage Detected</Badge>}
                </div>
              </div>
              
              <div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>New Damage Detected</span>
                <p style={{ fontWeight: 'var(--font-medium)' }}>{aiData.summary.new_damage_detected ? 'Yes' : 'No'}</p>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>AI Confidence</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${aiData.summary.overall_confidence}%`, height: '100%', backgroundColor: 'var(--brand-primary)' }}></div>
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{aiData.summary.overall_confidence}%</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Damages List */}
        <Card>
          <CardHeader>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Findings ({aiData.damages.length})</h3>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            {aiData.damages.length === 0 ? (
              <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <CheckCircle size={32} style={{ margin: '0 auto var(--spacing-2)', color: 'var(--success)' }} />
                <p>No new damage detected.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {aiData.damages.map((damage, idx) => (
                  <div key={idx} style={{ padding: 'var(--spacing-4)', borderBottom: idx !== aiData.damages.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                      <h4 style={{ fontWeight: 'var(--font-medium)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <AlertTriangle size={16} color="var(--warning)" />
                        {damage.panel_or_area} ({damage.side})
                      </h4>
                      <Badge variant="warning">{damage.severity} {damage.damage_type}</Badge>
                    </div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-2)' }}>
                      {damage.description}
                    </p>
                    <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: 'var(--spacing-2)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}>
                      <span style={{ fontWeight: 'var(--font-medium)' }}>AI Reasoning: </span>
                      {damage.reasoning}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Unreviewable Areas */}
      {aiData.unreviewable_areas.length > 0 && (
        <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: 'var(--spacing-3) var(--spacing-4)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-6)' }}>
          <Info size={20} style={{ color: 'var(--text-secondary)', marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Unreviewable Areas</h4>
            <ul style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-1)', listStyle: 'disc', paddingLeft: 'var(--spacing-4)' }}>
              {aiData.unreviewable_areas.map((area, idx) => (
                <li key={idx}><strong>{area.panel_or_area}:</strong> {area.reason}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Side-by-side viewer */}
      <Card style={{ marginBottom: 'var(--spacing-6)' }}>
        <CardHeader>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Image Comparison</h3>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'flex', gap: 'var(--spacing-4)', overflowX: 'auto', paddingBottom: 'var(--spacing-2)' }}>
            {/* Mocking just one comparison for the damaged area */}
            <div style={{ minWidth: '300px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Rear-Right (Check-Out)</span>
              </div>
              <div style={{ height: '200px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                [Before Image Mock]
              </div>
            </div>
            <div style={{ minWidth: '300px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Rear-Right (Check-In)</span>
                <Badge variant="warning">Flagged</Badge>
              </div>
              <div style={{ height: '200px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                [After Image Mock]
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Staff Final Decision */}
      <Card style={{ borderColor: 'var(--brand-primary)' }}>
        <CardHeader style={{ backgroundColor: 'var(--brand-secondary)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--brand-primary)' }}>Staff Final Decision</h3>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
            <Button 
              variant={decision === 'Approve Return' ? 'primary' : 'secondary'} 
              onClick={() => setDecision('Approve Return')}
            >
              Approve Return
            </Button>
            <Button 
              variant={decision === 'Manual Review' ? 'primary' : 'secondary'} 
              onClick={() => setDecision('Manual Review')}
              style={{ backgroundColor: decision === 'Manual Review' ? 'var(--warning)' : undefined, color: decision === 'Manual Review' ? 'white' : undefined, borderColor: decision === 'Manual Review' ? 'var(--warning)' : undefined }}
            >
              Needs Manual Review
            </Button>
            <Button 
              variant={decision === 'Charge Damage Fee' ? 'primary' : 'secondary'} 
              onClick={() => setDecision('Charge Damage Fee')}
              style={{ backgroundColor: decision === 'Charge Damage Fee' ? 'var(--danger)' : undefined, color: decision === 'Charge Damage Fee' ? 'white' : undefined, borderColor: decision === 'Charge Damage Fee' ? 'var(--danger)' : undefined }}
            >
              Charge Damage Fee
            </Button>
          </div>

          <div className="form-group">
            <label className="form-label">Reviewer Notes (Optional)</label>
            <textarea 
              className="form-input" 
              rows={3} 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Add any final remarks regarding this inspection..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
            <Button disabled={!decision} onClick={handleFinalize}>
              Finalize Inspection
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
