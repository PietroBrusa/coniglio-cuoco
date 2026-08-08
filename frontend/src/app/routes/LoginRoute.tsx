import { Navigate, useNavigate } from 'react-router';
import LoginScreen from '@/screens/LoginScreen/LoginScreen';
import { useAuth } from '@/context/AuthContext';

/**
 * Schermata di accesso.
 *
 * Chi è già autenticato non la vede: viene mandato direttamente al setup.
 */
export default function LoginRoute() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  if (isLoggedIn) return <Navigate to="/setup" replace />;
  return <LoginScreen onLogin={() => navigate('/setup')} />;
}
