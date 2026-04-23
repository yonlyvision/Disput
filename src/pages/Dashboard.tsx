import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, type BadgeVariant } from '../components/ui/Badge';
import { mockRentals } from '../lib/mockData';
import type { RentalStatus } from '../types';
import { Plus, Play, CheckCircle, FileText } from 'lucide-react';

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
  const activeRentals = mockRentals.length;
  const awaitingReturn = mockRentals.filter(r => r.status === 'Check-Out Completed' || r.status === 'Awaiting Return').length;
  const needsReview = mockRentals.filter(r => r.status === 'AI Review Ready' || r.status === 'Manual Review Needed').length;
  const completed = mockRentals.filter(r => r.status === 'Completed').length;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--spacing-1)' }}>Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your active rentals and inspections.</p>
        </div>
        <Link to="/rentals/new">
          <Button>
            <Plus size={18} />
            Create New Rental
          </Button>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-8)' }}>
        <Card>
          <CardBody>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Active Rentals</h3>
            <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginTop: 'var(--spacing-2)' }}>{activeRentals}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Awaiting Return</h3>
            <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginTop: 'var(--spacing-2)' }}>{awaitingReturn}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Needs Review</h3>
            <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--danger)', marginTop: 'var(--spacing-2)' }}>{needsReview}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Completed</h3>
            <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginTop: 'var(--spacing-2)' }}>{completed}</p>
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
              {mockRentals.map(rental => (
                <tr key={rental.id}>
                  <td style={{ fontWeight: 'var(--font-medium)' }}>{rental.id.toUpperCase()}</td>
                  <td>{rental.customer_name}</td>
                  <td>{rental.vehicle?.year} {rental.vehicle?.make} {rental.vehicle?.model}<br/><span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{rental.vehicle?.plate_number}</span></td>
                  <td><Badge variant={getStatusBadgeVariant(rental.status)}>{rental.status}</Badge></td>
                  <td>
                    <div style={{ fontSize: 'var(--text-xs)' }}>
                      Out: {new Date(rental.start_date).toLocaleDateString()}<br/>
                      In: {rental.actual_return_date ? new Date(rental.actual_return_date).toLocaleDateString() : 'Pending'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
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
