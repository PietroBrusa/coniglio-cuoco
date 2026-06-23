import { Navigate, useNavigate } from 'react-router';
import SessionSummary from '../screens/SessionSummary';
import { useGame } from '../context/GameContext';

/** Route /summary: riepilogo e salvataggio della sessione completata. */
export default function SummaryRoute() {
  const navigate = useNavigate();
  const { session, newSession } = useGame();
  if (!session) return <Navigate to="/setup" replace />;
  return (
    <SessionSummary
      session={session}
      onNewSession={() => {
        newSession();
        navigate('/setup');
      }}
    />
  );
}
