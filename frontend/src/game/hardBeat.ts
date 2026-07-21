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

/** `min === max` is a fixed cadence; `min < max` makes the beat unpredictable. */
export function sampleBeatMs([min, max]: [number, number], rand: () => number = Math.random): number {
  return min + rand() * (max - min);
}

/**
 * Whether a single continuous press covered the `hold` window from opening to
 * close. `pressStart` is `null` when nothing is being touched as it closes.
 */
export function isHeldThrough(openedAt: number, pressStart: number | null): boolean {
  if (pressStart === null) return false; // released before the window closed
  return pressStart >= openedAt - HOLD_EARLY_MS && pressStart <= openedAt + HOLD_GRACE_MS;
}
