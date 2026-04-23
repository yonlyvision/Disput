import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateRental } from './pages/CreateRental';
import { CheckOut } from './pages/CheckOut';
import { CheckIn } from './pages/CheckIn';
import { AiReview } from './pages/AiReview';
import { Report } from './pages/Report';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Layout />}>
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
