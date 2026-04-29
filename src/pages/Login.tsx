import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/submissions';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      navigate('/dashboard');
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      navigate('/dashboard');
    }
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

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)',
              backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)', padding: 'var(--spacing-3)',
              fontSize: 'var(--text-sm)', color: 'var(--danger-text)',
              marginBottom: 'var(--spacing-4)',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <Input
              label="Email address"
              type="email"
              placeholder="staff@rental.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <Button variant="primary" fullWidth type="submit" disabled={loading} style={{ marginTop: 'var(--spacing-4)' }}>
              {loading ? 'Signing in...' : 'Enter Dashboard'}
            </Button>
          </form>

          {!isSupabaseConfigured() && (
            <div style={{ marginTop: 'var(--spacing-6)', textAlign: 'center' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                Demo Mode • Auth bypassed (Supabase not configured)
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
