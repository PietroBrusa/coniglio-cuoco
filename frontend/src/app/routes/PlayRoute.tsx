import { Navigate, useNavigate } from 'react-router';
import LevelPlay from '@/screens/LevelPlay/LevelPlay';
import { useGame } from '@/context/GameContext';

export default function PlayRoute() {
  const navigate = useNavigate();
  const { session, level, food, difficulty, completeLevel } = useGame();
  if (!session) return <Navigate to="/setup" replace />;
  return (
    <LevelPlay
      key={level.id}
      level={level}
      food={food}
      difficulty={difficulty}
      onComplete={(result, beatsScored) => {
        completeLevel(result, beatsScored);
        navigate('/reward');
      }}
    />
  );
}
