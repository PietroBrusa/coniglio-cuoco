import { Navigate, useNavigate } from 'react-router';
import RewardScreen from '@/screens/RewardScreen/RewardScreen';
import { useGame } from '@/context/GameContext';

/**
 * Collega la schermata del premio all'esito dell'ultimo livello.
 *
 * Il fatto che il livello fosse l'ultimo va letto **prima** di avanzare: dopo,
 * la destinazione risulterebbe già cambiata e il percorso salterebbe il
 * riepilogo.
 */
export default function RewardRoute() {
  const navigate = useNavigate();
  const { lastResult, lastBeatScore, level, difficulty, isLastLevel, next } = useGame();
  if (!lastResult) return <Navigate to="/setup" replace />;
  return (
    <RewardScreen
      level={level}
      metrics={lastResult}
      difficulty={difficulty}
      beatsScored={lastBeatScore}
      isLastLevel={isLastLevel}
      onNext={() => {
        const wasLast = isLastLevel;
        next();
        navigate(wasLast ? '/summary' : '/play');
      }}
      onRepeat={() => navigate('/play')}
    />
  );
}
