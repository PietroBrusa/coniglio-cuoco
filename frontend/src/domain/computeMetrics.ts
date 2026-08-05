import type { Metrics, TouchRecord } from '@/types';

export interface Snapshot {
  touches: TouchRecord[];
  downAt: number | null;
  start: number;
  now: number;
  latency: number | null;
}

export const emptySnap = (): Snapshot => ({
  touches: [],
  downAt: null,
  start: 0,
  now: 0,
  latency: null,
});

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
