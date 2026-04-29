import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateRental } from './pages/CreateRental';
import { CheckOut } from './pages/CheckOut';
import { CheckIn } from './pages/CheckIn';
import { AiReview } from './pages/AiReview';
import { Report } from './pages/Report';
import { CaptureLink } from './pages/CaptureLink';
import { supabase } from './lib/supabase';
import { isSupabaseConfigured } from './lib/submissions';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checked, setChecked] = useState(!isSupabaseConfigured()); // skip check in demo mode
  const [authed, setAuthed] = useState(!isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!checked) return null; // brief flash while session resolves

  return authed ? <>{children}</> : <Navigate to="/" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Public capture page — no nav, customer-facing */}
      <Route path="/capture/:id" element={<CaptureLink />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rentals/new" element={<CreateRental />} />
        <Route path="/rentals/:id/checkout" element={<CheckOut />} />
        <Route path="/rentals/:id/checkin" element={<CheckIn />} />
        <Route path="/rentals/:id/review" element={<AiReview />} />
        <Route path="/rentals/:id/report" element={<Report />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
