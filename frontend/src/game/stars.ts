import type { Difficulty, Level, Metrics } from '../types';
import type { AppSettings } from './settings';

/**
 * Computes the star rating (1–3) in a way that is fair across mechanics and
 * difficulty settings:
 * 1) always 1 star for completing the level;
 * 2) +1 for a prompt approach (low latency to first tap);
 * 3) +1 for sustained engagement, with a threshold suited to the active mechanic
 *    (engagement ratio for "hold" levels, total contact time for "tap" levels).
 *
 * The thresholds come from {@link AppSettings}, so they are configurable by the
 * therapist from the in-app settings screen.
 * @param metrics - Live metrics from the completed level.
 * @param level - The level definition (used for `mode`).
 * @param difficulty - Session difficulty (affects which mechanic is used).
 * @param settings - Operator-configurable thresholds.
 * @returns Star count in the range [1, 3].
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
