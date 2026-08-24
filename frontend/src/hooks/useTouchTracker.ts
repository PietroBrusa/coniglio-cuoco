import { useCallback, useEffect, useRef, useState } from 'react';
import type { Metrics, TouchRecord } from '@/types';
import { computeMetrics, emptySnap, type Snapshot } from '@/domain/computeMetrics';
import { useMakeyKey } from './useMakeyKey';

export interface TouchTracker {
  metrics: Metrics;
  isDown: boolean;
  hasStarted: boolean;
  getResult: (sessionDurationMs?: number) => Metrics;
}

export function useTouchTracker(active: boolean): TouchTracker {
  //Istante dove parte il livello
  const playStartRef = useRef(0);
  //Istante dove il bambino tocca per la prima volta
  const startRef = useRef(0);
  //Tempo impiegato dal bambino per il primo tocco dall'inizio
  const latencyRef = useRef<number | null>(null);
  //Istante del tocco in corso (null se non sto toccando)
  const downAtRef = useRef<number | null>(null);
  //Tocchi conclusi relativi a startRef
  const touchesRef = useRef<TouchRecord[]>([]);

  const [snap, setSnap] = useState<Snapshot>(emptySnap);

  //Copia i valori dei ref nello snap per disegnare il tutto
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

  //Gestione tocco (schiaccio)
  const pressDown = useCallback(() => {
    if (!active) return;
    //ignora un secondo tocco down se il dito è già giù
    if (downAtRef.current !== null) return;
    const now = performance.now();
    //parte la finestra di durata sessionDurationMs 
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
    //ignora il pressup se non ho mai premuto
    if (downAt === null) return;
    const up = performance.now();
    //aggiunge i tocchi
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

  //Timer per far andare publish ogni 100 ms
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => {
      //non aggiorna se non è partita la finestra
      if (startRef.current !== 0) publish();
    }, 100);
    return () => clearInterval(id);
  }, [active, publish]);

  //Ritorna i risultati finali
  const getResult = useCallback((sessionDurationMs?: number) => {
    const now = performance.now();
    const start = startRef.current;
    const touches = touchesRef.current.slice();

    const downAt = downAtRef.current;
    //se sto tenendo premuto alla fine di sessionDurationMs , chiude automaticamente
    if (downAt !== null) {
      touches.push({ down: downAt - start, up: now - start, duration: now - downAt });
    }
    //Taglia i contatti che durano oltre sessionDurationMs 
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

//Taglia il tocco oltre sessionDurationMs 
function clipTouch(touch: TouchRecord, limit: number): TouchRecord | null {
  const down = Math.max(0, touch.down);
  const up = Math.min(touch.up, limit);
  return up > down ? { down, up, duration: up - down } : null;
}
