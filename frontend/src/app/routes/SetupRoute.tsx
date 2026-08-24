import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import SetupScreen from '@/screens/SetupScreen/SetupScreen';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { useSessions } from '@/hooks/useSessions';
import { foodProgress } from '@/domain/foodProgress';

export default function SetupRoute() {
  const navigate = useNavigate();
  const { childId, logout } = useAuth();
  const { startSession } = useGame();
  const { data: sessions, isLoading } = useSessions(childId ?? undefined);

  const progressByFood = useMemo(() => foodProgress(sessions ?? []), [sessions]);

  return (
    <SetupScreen
      childId={childId ?? ''}
      progressByFood={progressByFood}
      progressLoading={isLoading}
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
