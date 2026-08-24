import { Navigate, useNavigate } from 'react-router';
import SessionSummary from '@/screens/SessionSummary/SessionSummary';
import PracticeSummary from '@/screens/PracticeSummary/PracticeSummary';
import { useGame } from '@/context/GameContext';

export default function SummaryRoute() {
  const navigate = useNavigate();
  const { session, sessionSaved, collectsData, markSessionSaved, newSession } = useGame();
  if (!session) return <Navigate to="/setup" replace />;

  const startOver = () => {
    newSession();
    navigate('/setup');
  };

  if (!collectsData) return <PracticeSummary onNewSession={startOver} />;

  return (
    <SessionSummary
      session={session}
      alreadySaved={sessionSaved}
      onSaved={markSessionSaved}
      onNewSession={startOver}
    />
  );
}
