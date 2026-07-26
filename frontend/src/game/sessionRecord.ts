import type { Difficulty, Level, Metrics, Session } from '../types';

export function createSession({
  childId,
  sessionNumber,
  foodLabel,
  difficulty,
}: {
  childId: string;
  sessionNumber: number;
  foodLabel: string;
  difficulty: Difficulty;
}): Session {
  return {
    childId: childId || 'anonimo',
    sessionNumber: sessionNumber || 1,
    food: foodLabel,
    difficulty,
    date: new Date().toISOString(),
    levels: [],
  };
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
          n: metrics.count,
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
