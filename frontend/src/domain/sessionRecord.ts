import type { Difficulty, Level, Metrics, Session } from '@/types';
import { getFood } from './levels';

//Se il gioco è in modalità difficile, il livello non viene aggiunto
export const collectsData = (difficulty: Difficulty | undefined): boolean =>
  difficulty !== 'difficile';

//Costruisce l'oggetto iniziale con dati default
export function createSession({
  childId,
  sessionNumber,
  foodId,
  difficulty,
  therapist,
}: {
  childId: string;
  sessionNumber: number;
  foodId: string;
  difficulty: Difficulty;
  therapist?: string;
}): Session {
  return {
    childId: childId || 'anonimo',
    sessionNumber: sessionNumber || 1,
    food: getFood(foodId).label,
    foodId,
    difficulty,
    therapist: therapist?.trim() ?? '',
    problemBehaviors: [],
    notes: '',
    date: new Date().toISOString(),
    levels: [],
  };
}

//Restituiscono una copia nuova dell'oggetto Session
export function annotateSession(
  session: Session,
  { problemBehaviors, notes }: { problemBehaviors: string[]; notes: string }
): Session {
  return { ...session, problemBehaviors, notes: notes.trim() };
}

export function addLevelResult(
  session: Session,
  { level, metrics }: { level: Level; metrics: Metrics }
): Session {
  return {
    ...session,
    levels: [
      ...session.levels,
      {
        levelId: level.id,
        levelName: level.name,
        behavior: level.behavior,
        mode: level.mode,
        target: level.target,
        metrics: {
          count: metrics.count,
          latencyMs: metrics.latencyMs,
          totalContactMs: metrics.totalContactMs,
          meanTouchMs: metrics.meanTouchMs,
          meanIrtMs: metrics.meanIrtMs,
          sessionDurationMs: metrics.sessionDurationMs,
          engagementRatio: metrics.engagementRatio,
          touches: metrics.touches,
        },
      },
    ],
  };
}
