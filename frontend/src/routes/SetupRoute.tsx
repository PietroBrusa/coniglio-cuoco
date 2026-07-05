import { useNavigate } from 'react-router';
import SetupScreen from '../screens/SetupScreen';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';

/** Route /setup: avvia una sessione, apre la dashboard o esegue il logout. */
export default function SetupRoute() {
  const navigate = useNavigate();
  const { childId, logout } = useAuth();
  const { startSession } = useGame();
  return (
    <SetupScreen
      childId={childId ?? ''}
      onStart={(params) => {
        startSession(params);
        navigate('/play');
      }}
      onOpenDashboard={() => navigate('/dashboard')}
      onOpenSettings={() => navigate('/settings')}
      onLogout={() => {
        logout();
        navigate('/login');
      }}
    />
  );
}
