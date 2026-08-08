import { Navigate, useNavigate } from 'react-router';
import LevelPlay from '@/screens/LevelPlay/LevelPlay';
import { useGame } from '@/context/GameContext';

/**
 * Collega la schermata di gioco alla sessione in corso.
 *
 * La chiave sul livello è essenziale: cambiando livello React smonta e rimonta
 * la schermata invece di riusarla, quindi tocchi di avvio, ritmo e misurazione
 * ripartono da zero. Senza, il secondo livello erediterebbe lo stato del primo.
 *
 * Se qualcuno apre questo indirizzo senza aver avviato una sessione — un
 * segnalibro, un ricaricamento — viene riportato al setup invece di trovare una
 * schermata rotta.
 */
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
