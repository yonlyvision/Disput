import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAppState, generateRentalId } from '../lib/store';
import type { Rental } from '../types';

export const CreateRental = () => {
  const navigate = useNavigate();
  const { dispatch } = useAppState();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customerName: '', customerPhone: '', dlNumber: '', email: '',
    plateNumber: '', vehicleMake: '', vehicleModel: '', vehicleYear: '',
    startDate: '', endDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const rentalId = generateRentalId();
    const newRental: Rental = {
      id: rentalId,
      vehicle_id: rentalId,
      customer_name: form.customerName || 'Unknown Customer',
      customer_phone: form.customerPhone || 'N/A',
      customer_email: form.email || undefined,
      staff_id: 'u1',
      status: 'Draft',
      start_date: form.startDate || new Date().toISOString(),
      expected_return_date: form.endDate || new Date().toISOString(),
      created_at: new Date().toISOString(),
      vehicle: {
        id: rentalId,
        plate_number: form.plateNumber || 'N/A',
        make: form.vehicleMake || 'N/A',
        model: form.vehicleModel || 'N/A',
        year: parseInt(form.vehicleYear) || 2024,
      },
    };

    dispatch({ type: 'CREATE_RENTAL', payload: newRental });
    dispatch({ type: 'SHOW_TOAST', payload: { message: `Rental ${rentalId.toUpperCase()} created. Starting check-out...`, type: 'success' } });

    setTimeout(() => {
      navigate(`/rentals/${rentalId}/checkout`);
    }, 500);
  };

  const handleFillDemo = () => {
    setForm({
      customerName: 'Diana Prince',
      customerPhone: '(555) 987-6543',
      dlNumber: 'DL99887766',
      email: 'diana@example.com',
      plateNumber: 'WW-2024',
      vehicleMake: 'BMW',
      vehicleModel: 'X5',
      vehicleYear: '2024',
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16),
    });
  };

  return (
    <div className="animate-fade-in page-narrow">
      <div className="page-header">
        <div>
          <h2 className="page-title">Create New Rental</h2>
          <p className="page-subtitle">Enter customer and vehicle details to begin a new rental.</p>
        </div>
        <Button variant="secondary" onClick={handleFillDemo}>Fill Demo Data</Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="section-card">
          <CardHeader><h3 className="section-title">Customer Details</h3></CardHeader>
          <CardBody className="form-grid">
            <Input name="customerName" label="Customer Full Name" placeholder="John Doe" value={form.customerName} onChange={handleChange} />
            <Input name="customerPhone" label="Customer Phone" type="tel" placeholder="(555) 000-0000" value={form.customerPhone} onChange={handleChange} />
            <Input name="dlNumber" label="Driver's License Number" placeholder="DL12345678" value={form.dlNumber} onChange={handleChange} />
            <Input name="email" label="Email Address" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange} />
          </CardBody>
        </Card>

        <Card className="section-card">
          <CardHeader><h3 className="section-title">Vehicle Details</h3></CardHeader>
          <CardBody className="form-grid">
            <Input name="plateNumber" label="Plate Number" placeholder="ABC-1234" value={form.plateNumber} onChange={handleChange} />
            <Input name="vehicleMake" label="Vehicle Make" placeholder="Toyota" value={form.vehicleMake} onChange={handleChange} />
            <Input name="vehicleModel" label="Vehicle Model" placeholder="Camry" value={form.vehicleModel} onChange={handleChange} />
            <Input name="vehicleYear" label="Vehicle Year" type="number" placeholder="2024" value={form.vehicleYear} onChange={handleChange} />
          </CardBody>
        </Card>

        <Card className="section-card">
          <CardHeader><h3 className="section-title">Rental Terms</h3></CardHeader>
          <CardBody className="form-grid">
            <Input name="startDate" label="Start Date & Time" type="datetime-local" value={form.startDate} onChange={handleChange} />
            <Input name="endDate" label="Expected Return Date & Time" type="datetime-local" value={form.endDate} onChange={handleChange} />
          </CardBody>
          <CardFooter className="form-actions">
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
