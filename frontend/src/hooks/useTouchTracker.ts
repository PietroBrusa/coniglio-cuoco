/**
 * Registrazione dei contatti con l'alimento.
 *
 * È l'unico punto in cui i contatti diventano una misura. L'ascolto
 * dell'hardware è delegato a {@link hooks/useMakeyKey}, il calcolo delle
 * metriche a {@link domain/computeMetrics.computeMetrics}, che è una funzione
 * pura: qui restano solo la registrazione degli eventi e il tempo.
 *
 * @module
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Metrics, TouchRecord } from '@/types';
import { computeMetrics, emptySnap, type Snapshot } from '@/domain/computeMetrics';
import { useMakeyKey } from './useMakeyKey';

/** Ciò che l'hook espone alla schermata di gioco. */
export interface TouchTracker {
  /** Misurazioni aggiornate in tempo reale, per la barra e i contatori a schermo. */
  metrics: Metrics;
  /** `true` mentre il contatto è in corso: muove l'espressione del coniglio. */
  isDown: boolean;
  /** `true` dopo il primo contatto: da lì parte la finestra di misura. */
  hasStarted: boolean;
  /** Chiude la misurazione e restituisce il risultato definitivo del livello. */
  getResult: (sessionDurationMs?: number) => Metrics;
}

/**
 * Registra i contatti con l'alimento e ne ricava le misurazioni.
 *
 * I dati veri stanno in `ref` e non in `state`: aggiornare lo stato provoca un
 * nuovo render e i gestori di evento rischierebbero di leggere valori superati,
 * perdendo contatti quando gli eventi arrivano ravvicinati. Le `ref` si
 * aggiornano in modo sincrono; per l'interfaccia il loro contenuto viene
 * ripubblicato a ogni evento e comunque dieci volte al secondo, così i
 * contatori avanzano anche mentre il dito resta fermo sull'alimento.
 *
 * Tutti i tempi usano `performance.now()`, orologio monotòno ad alta
 * risoluzione: `Date.now()` può saltare all'indietro per un aggiustamento
 * dell'ora di sistema.
 *
 * @param active - `true` durante la fase di gioco. Passando da inattivo ad
 * attivo la misurazione si azzera, così i tocchi di avvio del livello non
 * entrano in nessuna metrica.
 * @returns Misurazioni correnti e funzione di chiusura della misura.
 */
export function useTouchTracker(active: boolean): TouchTracker {
  const playStartRef = useRef(0);
  const startRef = useRef(0);
  const latencyRef = useRef<number | null>(null);
  const downAtRef = useRef<number | null>(null);
  const touchesRef = useRef<TouchRecord[]>([]);

  const [snap, setSnap] = useState<Snapshot>(emptySnap);

  const publish = useCallback(() => {
    setSnap({
      touches: touchesRef.current.slice(),
      downAt: downAtRef.current,
      start: startRef.current,
      now: performance.now(),
      latency: latencyRef.current,
    });
  }, []);

  const reset = useCallback(() => {
    playStartRef.current = performance.now();
    startRef.current = 0;
    latencyRef.current = null;
    downAtRef.current = null;
    touchesRef.current = [];
    publish();
  }, [publish]);

  const pressDown = useCallback(() => {
    if (!active) return;
    if (downAtRef.current !== null) return;
    const now = performance.now();
    if (startRef.current === 0) {
      startRef.current = now;
      latencyRef.current = now - playStartRef.current;
    }
    downAtRef.current = now;
    publish();
  }, [active, publish]);

  const pressUp = useCallback(() => {
    if (!active) return;
    const downAt = downAtRef.current;
    if (downAt === null) return;
    const up = performance.now();
    touchesRef.current.push({
      down: downAt - startRef.current,
      up: up - startRef.current,
      duration: up - downAt,
    });
    downAtRef.current = null;
    publish();
  }, [active, publish]);

  useEffect(() => {
    if (active) reset();
  }, [active, reset]);

  useMakeyKey(active, { onPress: pressDown, onRelease: pressUp });

  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => {
      if (startRef.current !== 0) publish();
    }, 100);
    return () => clearInterval(id);
  }, [active, publish]);

  const getResult = useCallback((sessionDurationMs?: number) => {
    const now = performance.now();
    const start = startRef.current;
    const touches = touchesRef.current.slice();

    const downAt = downAtRef.current;
    if (downAt !== null) {
      touches.push({ down: downAt - start, up: now - start, duration: now - downAt });
    }

    const limit = sessionDurationMs ?? (start ? now - start : 0);
    const clipped = touches.map((t) => clipTouch(t, limit)).filter((t): t is TouchRecord => !!t);

    return computeMetrics(
      { touches: clipped, downAt: null, start, now, latency: latencyRef.current },
      sessionDurationMs,
    );
  }, []);

  return {
    metrics: computeMetrics(snap),
    isDown: snap.downAt !== null,
    hasStarted: snap.start !== 0,
    getResult,
  };
}

/**
 * Riporta un contatto dentro la finestra di misura.
 *
 * Serve al contatto ancora aperto allo scadere del tempo: senza il taglio il
 * contatto totale potrebbe superare la durata della sessione e l'engagement
 * ratio andare oltre il 100%, un dato impossibile da difendere.
 *
 * @returns Il contatto troncato, oppure `null` se cade interamente fuori dalla finestra.
 */
function clipTouch(touch: TouchRecord, limit: number): TouchRecord | null {
  const down = Math.max(0, touch.down);
  const up = Math.min(touch.up, limit);
  return up > down ? { down, up, duration: up - down } : null;
}
