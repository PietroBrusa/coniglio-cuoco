import { useCallback, useEffect, useRef, useState } from 'react';
import type { Metrics, TouchRecord } from '../types';
import { computeMetrics, emptySnap, type Snapshot } from '../utils/computeMetrics';

export const MAKEY_KEYS = ['Space'];

export interface TouchTracker {
  metrics: Metrics;
  isDown: boolean;
  hasStarted: boolean;
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
    onPointerCancel: () => void;
  };
  reset: () => void;
  getResult: (sessionDurationMs?: number) => Metrics;
}

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
      if (startRef.current !== 0) publish();
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
    pointerHandlers,
    reset,
    getResult,
  };
}

function clipTouch(touch: TouchRecord, limit: number): TouchRecord | null {
  const down = Math.max(0, touch.down);
  const up = Math.min(touch.up, limit);
  return up > down ? { down, up, duration: up - down } : null;
}
