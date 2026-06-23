import { Navigate, useNavigate } from 'react-router';
import RewardScreen from '../screens/RewardScreen';
import { useGame } from '../context/GameContext';

/** Route /reward: mostra le stelle del livello; prosegue o lo ripete. */
export default function RewardRoute() {
  const navigate = useNavigate();
  const { lastResult, level, difficulty, isLastLevel, next } = useGame();
  if (!lastResult) return <Navigate to="/setup" replace />;
  return (
    <RewardScreen
      level={level}
      metrics={lastResult}
      difficulty={difficulty}
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
