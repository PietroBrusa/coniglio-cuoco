/**
 * Pure timing rules of the hard-mode ("piano tiles") beat. The scheduler itself
 * lives in `screens/LevelPlay.tsx`; only the decisions are here, so they can be
 * tested without real timers.
 */

/**
 * Tolerances for a `hold` beat. The press may land slightly before the window
 * opens (anticipation) or shortly after it (reaction time) and still be counted
 * as covering the whole window.
 */
export const HOLD_EARLY_MS = 150;
export const HOLD_GRACE_MS = 400;

/**
 * Samples a duration from an inclusive `[min, max]` range.
 * A range with `min === max` is a fixed cadence (level 1); `min < max` makes the
 * beat unpredictable (levels 2 and 3).
 * @param range - The `[min, max]` bounds, in ms.
 * @param rand - Source of randomness in `[0, 1)`; injectable for tests.
 * @returns The sampled duration, in ms.
 */
export function sampleBeatMs([min, max]: [number, number], rand: () => number = Math.random): number {
  return min + rand() * (max - min);
}

/**
 * Decides whether a `hold` window is scored, i.e. whether a single continuous
 * press covered it from opening to close.
 * @param openedAt - When the lit window opened (`performance.now()` ms).
 * @param pressStart - When the press in progress began, or `null` if nothing is
 *   being touched at the moment the window closes (released too early).
 * @returns `true` if the window is scored.
 */
export function isHeldThrough(openedAt: number, pressStart: number | null): boolean {
  if (pressStart === null) return false; // released before the window closed
  return pressStart >= openedAt - HOLD_EARLY_MS && pressStart <= openedAt + HOLD_GRACE_MS;
}
