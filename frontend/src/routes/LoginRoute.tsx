import { Navigate, useNavigate } from 'react-router';
import LoginScreen from '../screens/LoginScreen';
import { useAuth } from '../context/AuthContext';

/** Route /login: se già autenticati rimanda al setup, altrimenti mostra il login. */
export default function LoginRoute() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  if (isLoggedIn) return <Navigate to="/setup" replace />;
  return <LoginScreen onLogin={() => navigate('/setup')} />;
}
