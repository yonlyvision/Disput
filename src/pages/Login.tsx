import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShieldCheck } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy login: just navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-tertiary)' }}>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <CardBody style={{ padding: 'var(--spacing-8)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
            <div style={{ display: 'inline-flex', padding: 'var(--spacing-3)', backgroundColor: 'var(--brand-secondary)', borderRadius: 'var(--radius-full)', marginBottom: 'var(--spacing-4)' }}>
              <ShieldCheck size={32} style={{ color: 'var(--brand-primary)' }} />
            </div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--spacing-2)' }}>Staff Portal</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Rental Damage Inspection System</p>
          </div>

          <form onSubmit={handleLogin}>
            <Input label="Email address" type="email" placeholder="staff@rental.com" defaultValue="staff@rental.com" required />
            <Input label="Password" type="password" placeholder="••••••••" defaultValue="password" required />
            
            <Button variant="primary" fullWidth type="submit" style={{ marginTop: 'var(--spacing-4)' }}>
              Enter Dashboard
            </Button>
          </form>
          
          <div style={{ marginTop: 'var(--spacing-6)', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              Mock Session • Real Auth Disabled for MVP
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
