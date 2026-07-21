import { useNavigate } from 'react-router';
import Dashboard from '../screens/Dashboard';
import { useAuth } from '../context/AuthContext';

export default function DashboardRoute() {
  const navigate = useNavigate();
  const { childId } = useAuth();
  return <Dashboard childId={childId ?? ''} onBack={() => navigate('/setup')} />;
}
