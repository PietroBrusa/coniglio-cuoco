import { useCallback, useEffect, useRef, useState } from 'react';
import type { Metrics, TouchRecord } from '../types';
import { computeMetrics, emptySnap, type Snapshot } from '../utils/computeMetrics';

/**
 * Touch measurement engine — the clinical core of the application.
 * Unifies two input sources (keyboard via Makey-Makey and pointer/mouse/touch)
 * and computes the behavioural metrics defined in the project specification.
 * The pure metric maths lives in `utils/computeMetrics.ts`.
 */

/**
 * Keyboard codes treated as a "touch" event.
 * The Makey-Makey is wired to a single conductive sensor that emits `Space`
 * (the front "click" input), so only that code is accepted to avoid false
 * positives from a physical keyboard near the test station.
 */
export const MAKEY_KEYS = ['Space'];

/** Value returned by the hook: live metrics, touch state and input handlers. */
export interface TouchTracker {
  /** Metrics updated in real time (drives the progress UI). */
  metrics: Metrics;
  /** `true` while a touch / key press is currently active. */
  isDown: boolean;
  /** Pointer event handlers to spread onto the food target element. */
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
    onPointerCancel: () => void;
  };
  /** Resets all measurements (call at the start of each level). */
  reset: () => void;
  /**
   * Computes and returns a frozen {@link Metrics} snapshot.
   * @param sessionDurationMs - Optional duration override (overrides `now - start`).
   */
  getResult: (sessionDurationMs?: number) => Metrics;
}

/**
 * Measurement hook. When `active` is `true` it listens for touch and keyboard
 * events and keeps metrics up to date. Uses `ref`s for sub-millisecond precision
 * (`performance.now()`) and publishes a state snapshot only on relevant changes
 * to avoid re-rendering on every raw event.
 * @param active - When `false` the hook is fully idle (no listeners, no timers).
 * @returns A {@link TouchTracker} with live metrics, state flags and input handlers.
 */
export function useTouchTracker(active: boolean): TouchTracker {
  const startRef = useRef(0);
  const downAtRef = useRef<number | null>(null); 
  const touchesRef = useRef<TouchRecord[]>([]);

  const [snap, setSnap] = useState<Snapshot>(emptySnap);

  const publish = useCallback(() => {
    setSnap({
      touches: touchesRef.current.slice(),
      downAt: downAtRef.current,
      start: startRef.current,
      now: performance.now(),
    });
  }, []);

  const reset = useCallback(() => {
    startRef.current = performance.now();
    downAtRef.current = null;
    touchesRef.current = [];
    publish();
  }, [publish]);

  const pressDown = useCallback(() => {
    if (!active) return;
    if (downAtRef.current !== null) return;
    downAtRef.current = performance.now();
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

  useEffect(() => {
    if (!active) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!MAKEY_KEYS.includes(e.code)) return;
      e.preventDefault();
      if (e.repeat) return;
      pressDown();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!MAKEY_KEYS.includes(e.code)) return;
      e.preventDefault();
      pressUp();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [active, pressDown, pressUp]);

  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => {
      if (downAtRef.current !== null) publish();
    }, 100);
    return () => clearInterval(id);
  }, [active, publish]);

  const pointerHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      pressDown();
    },
    onPointerUp: () => pressUp(),
    onPointerLeave: () => pressUp(),
    onPointerCancel: () => pressUp(),
  };

  const getResult = useCallback((sessionDurationMs?: number) => {
    const now = performance.now();
    const touches = touchesRef.current.slice();
    // Se un tocco è ancora premuto (il livello si completa senza rilascio, tipico
    // dei livelli "hold"), chiudilo ora così la sua durata entra nelle metriche.
    const downAt = downAtRef.current;
    if (downAt !== null) {
      touches.push({
        down: downAt - startRef.current,
        up: now - startRef.current,
        duration: now - downAt,
      });
    }
    return computeMetrics(
      { touches, downAt: null, start: startRef.current, now },
      sessionDurationMs
    );
  }, []);

  return {
    metrics: computeMetrics(snap),
    isDown: snap.downAt !== null,
    pointerHandlers,
    reset,
    getResult,
  };
}
