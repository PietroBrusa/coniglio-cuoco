import type { Difficulty, Level, Metrics } from '../types';
import type { AppSettings } from './settings';

/**
 * Star rating (1–3), fair across mechanics and difficulty settings: 1 star for
 * completing the level, +1 for a prompt approach, +1 for sustained engagement
 * measured against the threshold suited to the active mechanic.
 */
export function computeStars(
  metrics: Metrics,
  level: Level,
  difficulty: Difficulty,
  settings: AppSettings,
): number {
  const mechanic: 'hold' | 'tap' =
    difficulty === 'difficile' || level.mode === 'count' ? 'tap' : 'hold';

  let stars = 1;

  if (metrics.latencyMs != null && metrics.latencyMs <= settings.promptLatencyMs) stars += 1;

  const engaged =
    mechanic === 'hold'
      ? metrics.engagementRatio >= settings.holdEngagementPct
      : metrics.totalContactMs >= settings.tapContactMs;
  if (engaged) stars += 1;

  return Math.min(3, stars);
}
