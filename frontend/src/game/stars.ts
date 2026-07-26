import type { Difficulty, Level, Metrics } from '../types';
import type { AppSettings } from './settings';

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
