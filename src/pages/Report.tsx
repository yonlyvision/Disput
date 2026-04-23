import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { mockRentals } from '../lib/mockData';
import { Printer, Download, Archive, User, Car } from 'lucide-react';

export const Report = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const rental = mockRentals.find(r => r.id === id) || mockRentals[0];

  // Mocked decision trail data
  const reportData = {
    ai_recommendation: 'Manual Review Needed',
    human_decision: 'Charge Damage Fee',
    reviewer_notes: 'Confirmed horizontal scratch on rear-right bumper. Not present in check-out photos. Charging standard minor scratch fee.',
    reviewer_name: 'John Doe',
    decision_timestamp: new Date().toISOString(),
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--spacing-1)' }}>Inspection Report</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Rental #{rental.id.toUpperCase()}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <Button variant="secondary"><Printer size={16} /> Print</Button>
          <Button variant="secondary"><Download size={16} /> PDF</Button>
          <Button variant="secondary"><Archive size={16} /> Archive</Button>
        </div>
      </div>

      <Card style={{ marginBottom: 'var(--spacing-6)' }}>
        <CardBody style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Final Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-1)' }}>
              <Badge variant="danger" style={{ fontSize: 'var(--text-base)', padding: 'var(--spacing-1) var(--spacing-3)' }}>{reportData.human_decision}</Badge>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Closed On</h3>
            <p style={{ fontWeight: 'var(--font-medium)' }}>{new Date(reportData.decision_timestamp).toLocaleString()}</p>
          </div>
        </CardBody>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-6)' }}>
        <Card>
          <CardHeader style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <User size={18} />
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Customer Details</h3>
          </CardHeader>
          <CardBody>
            <p><strong>Name:</strong> {rental.customer_name}</p>
            <p><strong>Phone:</strong> {rental.customer_phone}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Car size={18} />
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Vehicle Details</h3>
          </CardHeader>
          <CardBody>
            <p><strong>Vehicle:</strong> {rental.vehicle?.year} {rental.vehicle?.make} {rental.vehicle?.model}</p>
            <p><strong>Plate:</strong> {rental.vehicle?.plate_number}</p>
          </CardBody>
        </Card>
      </div>

      <Card style={{ marginBottom: 'var(--spacing-6)' }}>
        <CardHeader>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Decision Trail</h3>
        </CardHeader>
        <div className="table-container">
          <table className="table">
            <tbody>
              <tr>
                <td style={{ width: '30%', color: 'var(--text-secondary)' }}>AI Recommendation</td>
                <td style={{ fontWeight: 'var(--font-medium)' }}>{reportData.ai_recommendation}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-secondary)' }}>Staff Decision</td>
                <td>
                  <span style={{ fontWeight: 'var(--font-medium)' }}>{reportData.human_decision}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: 'var(--spacing-2)' }}>by {reportData.reviewer_name}</span>
                </td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-secondary)' }}>Reviewer Notes</td>
                <td style={{ fontStyle: 'italic' }}>"{reportData.reviewer_notes}"</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-8)' }}>
        <Button onClick={() => navigate('/dashboard')} variant="ghost">Return to Dashboard</Button>
      </div>
    </div>
  );
};
