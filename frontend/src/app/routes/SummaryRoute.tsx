import { Navigate, useNavigate } from 'react-router';
import SessionSummary from '@/screens/SessionSummary/SessionSummary';
import { useGame } from '@/context/GameContext';

export default function SummaryRoute() {
  const navigate = useNavigate();
  const { session, sessionSaved, markSessionSaved, newSession } = useGame();
  if (!session) return <Navigate to="/setup" replace />;
  return (
    <SessionSummary
      session={session}
      alreadySaved={sessionSaved}
      onSaved={markSessionSaved}
      onNewSession={() => {
        newSession();
        navigate('/setup');
      }}
    />
  );
}
