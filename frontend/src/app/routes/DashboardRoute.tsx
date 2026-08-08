import { useNavigate } from 'react-router';
import Dashboard from '@/screens/Dashboard/Dashboard';
import { useAuth } from '@/context/AuthContext';

/** Collega la dashboard delle sessioni salvate al bambino autenticato. */
export default function DashboardRoute() {
  const navigate = useNavigate();
  const { childId } = useAuth();
  return <Dashboard childId={childId ?? ''} onBack={() => navigate('/setup')} />;
}
