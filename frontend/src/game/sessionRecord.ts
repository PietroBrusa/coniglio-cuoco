import type { Difficulty, Level, Metrics, Session } from '../types';

/**
 * Immutable construction of the session record (domain logic).
 * CSV / JSON serialisation lives in `utils/exportSession.ts`.
 */

/**
 * Creates an empty session with metadata and no completed levels.
 * @param params.childId - Child's identifier; falls back to `'anonimo'` if empty.
 * @param params.sessionNumber - Sequential session number chosen at setup.
 * @param params.foodLabel - Display name of the selected food.
 * @param params.difficulty - Chosen difficulty level.
 * @returns A new {@link Session} with an empty `levels` array.
 */
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

/**
 * Returns a **new** session with the completed level's result appended to `levels`.
 * Live {@link Metrics} are reduced to the persisted form: `count` is renamed to `n`.
 * @param session - The current session (never mutated).
 * @param params.level - The level that was just completed.
 * @param params.metrics - Live metrics captured by {@link useTouchTracker}.
 * @returns A new {@link Session} with the level result appended.
 */
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
