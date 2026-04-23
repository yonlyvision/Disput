import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const CreateRental = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // In a real app, we'd save to DB and navigate to the new rental's checkout
      navigate('/rentals/NEW-RNTL-123/checkout');
    }, 800);
  };

  const handleFillDemo = () => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      if (input.name === 'customerName') input.value = 'John Doe';
      if (input.name === 'customerPhone') input.value = '(555) 123-4567';
      if (input.name === 'plateNumber') input.value = 'ABC-1234';
      if (input.name === 'vehicleMake') input.value = 'Toyota';
      if (input.name === 'vehicleModel') input.value = 'Camry';
      if (input.name === 'vehicleYear') input.value = '2024';
      if (input.type === 'datetime-local') input.value = new Date().toISOString().slice(0, 16);
    });
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--spacing-1)' }}>Create New Rental</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Enter customer and vehicle details to begin a new rental.</p>
        </div>
        <Button variant="secondary" onClick={handleFillDemo}>Fill Demo Data</Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card style={{ marginBottom: 'var(--spacing-6)' }}>
          <CardHeader>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Customer Details</h3>
          </CardHeader>
          <CardBody style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
            <Input name="customerName" label="Customer Full Name" placeholder="John Doe" />
            <Input name="customerPhone" label="Customer Phone" type="tel" placeholder="(555) 000-0000" />
            <Input name="dlNumber" label="Driver's License Number" placeholder="DL12345678" />
            <Input name="email" label="Email Address" type="email" placeholder="john@example.com" />
          </CardBody>
        </Card>

        <Card style={{ marginBottom: 'var(--spacing-6)' }}>
          <CardHeader>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Vehicle Details</h3>
          </CardHeader>
          <CardBody style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
            <Input name="plateNumber" label="Plate Number" placeholder="ABC-1234" />
            <Input name="vehicleMake" label="Vehicle Make" placeholder="Toyota" />
            <Input name="vehicleModel" label="Vehicle Model" placeholder="Camry" />
            <Input name="vehicleYear" label="Vehicle Year" type="number" placeholder="2024" />
          </CardBody>
        </Card>

        <Card style={{ marginBottom: 'var(--spacing-6)' }}>
          <CardHeader>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Rental Terms</h3>
          </CardHeader>
          <CardBody style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
            <Input name="startDate" label="Start Date & Time" type="datetime-local" />
            <Input name="endDate" label="Expected Return Date & Time" type="datetime-local" />
          </CardBody>
          <CardFooter style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
            <Button variant="ghost" type="button" onClick={() => navigate('/dashboard')}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Rental & Start Check-Out'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};
