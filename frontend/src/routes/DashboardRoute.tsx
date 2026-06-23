import { useNavigate } from 'react-router';
import Dashboard from '../screens/Dashboard';
import { useAuth } from '../context/AuthContext';

/** Route /dashboard: elenco delle sessioni salvate del bambino. */
export default function DashboardRoute() {
  const navigate = useNavigate();
  const { childId } = useAuth();
  return <Dashboard childId={childId ?? ''} onBack={() => navigate('/setup')} />;
}
