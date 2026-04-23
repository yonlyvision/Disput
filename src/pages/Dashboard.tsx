import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, type BadgeVariant } from '../components/ui/Badge';
import { useAppState } from '../lib/store';
import type { RentalStatus } from '../types';
import { Plus, Play, CheckCircle, FileText, RefreshCw } from 'lucide-react';

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

export const Dashboard = () => {
  const { state, dispatch } = useAppState();
  const rentals = state.rentals;

  const activeRentals = rentals.filter(r => r.status !== 'Completed').length;
  const awaitingReturn = rentals.filter(r => r.status === 'Check-Out Completed' || r.status === 'Awaiting Return').length;
  const needsReview = rentals.filter(r => r.status === 'AI Review Ready' || r.status === 'Manual Review Needed').length;
  const completed = rentals.filter(r => r.status === 'Completed').length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Manage your active rentals and inspections.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="ghost" onClick={() => dispatch({ type: 'RESET_STATE' })} style={{ color: 'var(--text-tertiary)' }}>
            <RefreshCw size={18} />
            Reset Data
          </Button>
          <Link to="/rentals/new">
            <Button>
              <Plus size={18} />
              Create New Rental
            </Button>
          </Link>
        </div>
      </div>

      <div className="summary-grid">
        <Card className="summary-card">
          <CardBody>
            <h3 className="summary-label">Active Rentals</h3>
            <p className="summary-value">{activeRentals}</p>
          </CardBody>
        </Card>
        <Card className="summary-card summary-card--warning">
          <CardBody>
            <h3 className="summary-label">Awaiting Return</h3>
            <p className="summary-value">{awaitingReturn}</p>
          </CardBody>
        </Card>
        <Card className="summary-card summary-card--danger">
          <CardBody>
            <h3 className="summary-label">Needs Review</h3>
            <p className="summary-value" style={{ color: needsReview > 0 ? 'var(--danger)' : undefined }}>{needsReview}</p>
          </CardBody>
        </Card>
        <Card className="summary-card summary-card--success">
          <CardBody>
            <h3 className="summary-label">Completed</h3>
            <p className="summary-value">{completed}</p>
          </CardBody>
        </Card>
      </div>

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
              {rentals.map(rental => (
                <tr key={rental.id}>
                  <td style={{ fontWeight: 'var(--font-medium)' }}>{rental.id.toUpperCase()}</td>
                  <td>{rental.customer_name}</td>
                  <td>
                    {rental.vehicle?.year} {rental.vehicle?.make} {rental.vehicle?.model}
                    <br/><span className="text-muted">{rental.vehicle?.plate_number}</span>
                  </td>
                  <td><Badge variant={getStatusBadgeVariant(rental.status)}>{rental.status}</Badge></td>
                  <td>
                    <div className="text-muted">
                      Out: {new Date(rental.start_date).toLocaleDateString()}<br/>
                      In: {rental.actual_return_date ? new Date(rental.actual_return_date).toLocaleDateString() : 'Pending'}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {rental.status === 'Draft' && (
                        <Link to={`/rentals/${rental.id}/checkout`}>
                          <Button variant="secondary"><Play size={16} /> Check-Out</Button>
                        </Link>
                      )}
                      {(rental.status === 'Check-Out Completed' || rental.status === 'Awaiting Return') && (
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
