import type { Metrics, TouchRecord } from '../types';

/** Immutable picture of the tracker state at a single instant. */
export interface Snapshot {
  /** Completed taps so far, timed from `start`. */
  touches: TouchRecord[];
  /** Start time of the tap currently in progress, or `null`. */
  downAt: number | null;
  /**
   * Start of the measurement window, which opens on the child's *first* contact.
   * `0` while the level is playable but has not been touched yet.
   */
  start: number;
  now: number;
  /**
   * Time from the level becoming playable to that first contact (ms). Measured
   * before the window opens, so it survives the window being anchored to the
   * first touch.
   */
  latency: number | null;
}

export const emptySnap = (): Snapshot => ({
  touches: [],
  downAt: null,
  start: 0,
  now: 0,
  latency: null,
});

/**
 * All times in milliseconds. `sessionDurationMs` is the duration to score
 * against and defaults to the time elapsed since the window opened; the level
 * passes its full window here, so the final ratio is measured against the whole
 * window and not against the moment the level happened to end.
 */
export function computeMetrics(
  { touches, downAt, start, now, latency }: Snapshot,
  sessionDurationMs?: number
): Metrics {
  const n = touches.length;
  const totalContactMs = touches.reduce((s, t) => s + t.duration, 0);
  const ongoing = downAt !== null ? now - downAt : 0;
  const liveContactMs = totalContactMs + ongoing;

  const latencyMs = latency;

  let meanIrtMs: number | null = null;
  if (n > 1) {
    let sum = 0;
    for (let i = 0; i < n - 1; i += 1) sum += touches[i + 1].down - touches[i].up;
    meanIrtMs = sum / (n - 1);
  }

  const duration = sessionDurationMs ?? (start ? now - start : 0);
  // Clamped: a press still down when the window closes can be timed a few
  // milliseconds past it, and a ratio over 100% would be nonsense on the chart.
  const engagementRatio = duration > 0 ? Math.min(100, (totalContactMs / duration) * 100) : 0;

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
