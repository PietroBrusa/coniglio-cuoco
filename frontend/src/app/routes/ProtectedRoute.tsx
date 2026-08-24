import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute() {
  const { isLoggedIn } = useAuth();
  //se arriva un errore 401 o logout, si viene r  ediretti alla schermata di login
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
}
