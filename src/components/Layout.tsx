import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, LogOut } from 'lucide-react';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/submissions';

export const Layout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)', padding: 'var(--spacing-3) var(--spacing-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
          <Shield style={{ color: 'var(--brand-primary)' }} />
          <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Rental Damage Inspection</h1>
        </Link>
        <nav style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut size={18} />
            Log Out
          </Button>
        </nav>
      </header>
      <main className="container" style={{ flex: 1, padding: 'var(--spacing-8) var(--spacing-4)' }}>
        <Outlet />
      </main>
      <footer className="app-footer">
        Rental Damage Inspection System • v1.1 MVP
      </footer>
    </div>
  );
};
