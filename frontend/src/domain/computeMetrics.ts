import type { Metrics, TouchRecord } from '@/types';

//Stato del gioco con i dati dei tocchi
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
  //Tocchi completati (usato per l'engagement ratio in stars.ts)
  const totalContactMs = touches.reduce((s, t) => s + t.duration, 0);
  const ongoing = downAt !== null ? now - downAt : 0;
  //Tocchi in corso (usato per la barra  che si carica in tempo reale in Levelplay.tsx)
  const liveContactMs = totalContactMs + ongoing;

  const latencyMs = latency;

  //Media dei tempi dove il bambino non sta toccando (solo se sono 2 o più)
  let meanIrtMs: number | null = null;
  if (n > 1) {
    let sum = 0;
    for (let i = 0; i < n - 1; i += 1) sum += touches[i + 1].down - touches[i].up;
    meanIrtMs = sum / (n - 1);
  }

  //Prende sessionDurationMs, altrimenti lo calcola da se
  const duration = sessionDurationMs ?? (start ? now - start : 0);
  //Calcolo engagement ratio
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
