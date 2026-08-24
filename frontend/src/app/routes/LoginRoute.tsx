import { Navigate, useNavigate } from 'react-router';
import LoginScreen from '@/screens/LoginScreen/LoginScreen';
import { useAuth } from '@/context/AuthContext';

export default function LoginRoute() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  if (isLoggedIn) return <Navigate to="/setup" replace />;
  return <LoginScreen onLogin={() => navigate('/setup')} />;
}
