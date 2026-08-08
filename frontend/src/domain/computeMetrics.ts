/**
 * Calcolo delle metriche comportamentali a partire dai contatti registrati.
 *
 * È volutamente una funzione pura, separata dall'hook che ascolta la tastiera:
 * tutta la matematica clinicamente rilevante si verifica in Node, senza browser,
 * senza timer e senza simulare eventi.
 *
 * @module
 */

import type { Metrics, TouchRecord } from '@/types';

/**
 * Fotografia dello stato della misurazione in un dato istante.
 *
 * Tutti i tempi sono in millisecondi di `performance.now()`, orologio monotòno
 * insensibile ai cambi di ora di sistema.
 */
export interface Snapshot {
  /** Contatti già conclusi, con tempi relativi al primo contatto. */
  touches: TouchRecord[];
  /** Istante di inizio del contatto ancora aperto, `null` se non si sta toccando. */
  downAt: number | null;
  /** Istante del primo contatto: è l'origine dei tempi. `0` se non è ancora avvenuto. */
  start: number;
  /** Istante a cui si riferisce la fotografia. */
  now: number;
  /** Latenza del primo contatto, già calcolata. `null` se non si è ancora toccato. */
  latency: number | null;
}

/** Fotografia iniziale, prima che il bambino tocchi l'alimento. */
export const emptySnap = (): Snapshot => ({
  touches: [],
  downAt: null,
  start: 0,
  now: 0,
  latency: null,
});

/**
 * Ricava le metriche del livello dalla fotografia della misurazione.
 *
 * Le formule applicate:
 *
 * - frequenza = numero di contatti conclusi;
 * - contatto totale = somma delle durate;
 * - durata media = contatto totale / frequenza;
 * - IRT medio = media di `down(i+1) − up(i)`, definito da due contatti in poi;
 * - engagement ratio = contatto totale / durata sessione × 100, saturato a 100.
 *
 * @param snapshot - Stato della misurazione da cui calcolare.
 * @param sessionDurationMs - Durata da usare come denominatore. A fine livello
 * si passa la durata nominale della finestra (es. 6000 ms) invece del tempo
 * realmente trascorso, così le percentuali restano confrontabili tra sessioni.
 * Omesso durante il gioco, dove serve il tempo corrente.
 * @returns Le metriche del livello; `liveContactMs` include il contatto ancora
 * aperto ed è pensato solo per la visualizzazione in tempo reale.
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
