import { Navigate, useNavigate } from 'react-router';
import SessionSummary from '@/screens/SessionSummary/SessionSummary';
import PracticeSummary from '@/screens/PracticeSummary/PracticeSummary';
import { useGame } from '@/context/GameContext';

/**
 * Collega la schermata di chiusura alla sessione conclusa.
 *
 * Una partita in modalità difficile non ha nulla da riepilogare né da salvare:
 * finisce sulla schermata della partita libera. Le sessioni che raccolgono dati
 * vanno invece al riepilogo, a cui si passa il fatto che siano già state scritte
 * nel database, così tornandoci non le si salva una seconda volta.
 */
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
