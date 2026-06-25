import type { Metrics, TouchRecord } from '../types';

/**
 * Pure metric engine for the touch tracker.
 * Kept free of React so it can be unit-tested in isolation; the stateful
 * listening/timing logic lives in `hooks/useTouchTracker.ts`.
 */

/** Immutable picture of the tracker state at a single instant. */
export interface Snapshot {
  /** Completed taps so far. */
  touches: TouchRecord[];
  /** Start time of the tap currently in progress, or `null`. */
  downAt: number | null;
  /** Session start timestamp. */
  start: number;
  /** Timestamp of this snapshot. */
  now: number;
}

/** An empty snapshot (no taps, session not started). */
export const emptySnap = (): Snapshot => ({ touches: [], downAt: null, start: 0, now: 0 });

/**
 * Computes {@link Metrics} from a touch snapshot. All times in milliseconds.
 * - **latency**: timestamp of the first tap's press.
 * - **totalContactMs**: sum of all completed tap durations.
 * - **meanIrtMs**: mean Inter-Response Time (gap between release and next press).
 * - **engagementRatio**: `totalContactMs / sessionDuration × 100`.
 * @param snapshot - Current ref values and timestamp.
 * @param sessionDurationMs - Optional override for the session duration.
 * @returns A fully populated {@link Metrics} object.
 */
export function computeMetrics(
  { touches, downAt, start, now }: Snapshot,
  sessionDurationMs?: number
): Metrics {
  const n = touches.length;
  const totalContactMs = touches.reduce((s, t) => s + t.duration, 0);
  const ongoing = downAt !== null ? now - downAt : 0;
  const liveContactMs = totalContactMs + ongoing;

  const latencyMs = n > 0 ? touches[0].down : null;

  let meanIrtMs: number | null = null;
  if (n > 1) {
    let sum = 0;
    for (let i = 0; i < n - 1; i += 1) sum += touches[i + 1].down - touches[i].up;
    meanIrtMs = sum / (n - 1);
  }

  const duration = sessionDurationMs ?? (start ? now - start : 0);
  const engagementRatio = duration > 0 ? (totalContactMs / duration) * 100 : 0;

  return {
    count: n,
    latencyMs,
    totalContactMs,
    liveContactMs,
    meanTouchMs: n > 0 ? totalContactMs / n : null,
    meanIrtMs,
    sessionDurationMs: duration,
    engagementRatio,
    touches,
  };
}
