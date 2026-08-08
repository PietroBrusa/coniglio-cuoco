import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/context/AuthContext';

/**
 * Sbarramento delle rotte private.
 *
 * Rende la rotta figlia se c'è una sessione di accesso attiva, altrimenti
 * riporta alla schermata di accesso. Un solo punto di controllo per tutte le
 * schermate protette.
 */
export default function ProtectedRoute() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
}
