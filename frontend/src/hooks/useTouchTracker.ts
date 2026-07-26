import { useCallback, useEffect, useRef, useState } from 'react';
import type { Metrics, TouchRecord } from '../types';
import { computeMetrics, emptySnap, type Snapshot } from '../utils/computeMetrics';

export const MAKEY_KEYS = ['Space'];

/** Sentinel pointer id for the Makey Makey / keyboard path, which has no pointer. */
const KEYBOARD_POINTER = -1;

export interface TouchTracker {
  metrics: Metrics;
  isDown: boolean;
  hasStarted: boolean;
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
  reset: () => void;
  getResult: (sessionDurationMs?: number) => Metrics;
}

export function useTouchTracker(active: boolean): TouchTracker {
  const playStartRef = useRef(0);
  const startRef = useRef(0);
  const latencyRef = useRef<number | null>(null);
  const downAtRef = useRef<number | null>(null);
  const activePointerRef = useRef<number | null>(null);
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
    activePointerRef.current = null;
    touchesRef.current = [];
    publish();
  }, [publish]);

  const pressDown = useCallback(
    (pointerId: number) => {
      if (!active) return;
      if (downAtRef.current !== null) return;
      const now = performance.now();
      if (startRef.current === 0) {
        startRef.current = now;
        latencyRef.current = now - playStartRef.current;
      }
      downAtRef.current = now;
      activePointerRef.current = pointerId;
      publish();
    },
    [active, publish],
  );

  const pressUp = useCallback(
    (pointerId: number) => {
      if (!active) return;
      const downAt = downAtRef.current;
      if (downAt === null) return;
      // Only the pointer that opened the contact may close it. The target shrinks
      // on press, so an unrelated pointer resting near its edge would otherwise
      // cross the boundary and truncate the measurement.
      if (activePointerRef.current !== null && activePointerRef.current !== pointerId) return;
      const up = performance.now();
      touchesRef.current.push({
        down: downAt - startRef.current,
        up: up - startRef.current,
        duration: up - downAt,
      });
      downAtRef.current = null;
      activePointerRef.current = null;
      publish();
    },
    [active, publish],
  );

  useEffect(() => {
    if (active) reset();
  }, [active, reset]);

  useEffect(() => {
    if (!active) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!MAKEY_KEYS.includes(e.code)) return;
      e.preventDefault();
      if (e.repeat) return;
      pressDown(KEYBOARD_POINTER);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!MAKEY_KEYS.includes(e.code)) return;
      e.preventDefault();
      pressUp(KEYBOARD_POINTER);
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
      capturePointer(e);
      pressDown(e.pointerId);
    },
    onPointerUp: (e: React.PointerEvent) => pressUp(e.pointerId),
    onPointerLeave: (e: React.PointerEvent) => pressUp(e.pointerId),
    onPointerCancel: (e: React.PointerEvent) => pressUp(e.pointerId),
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

/**
 * Binds the pointer to the target for the whole contact. The food button shrinks
 * (`transform: scale(.92)` over 0.1s) as soon as a press registers, so without
 * capture a pointer resting near the edge leaves the shrinking element and
 * `onPointerLeave` cuts the contact short after ~100ms, under-reporting it.
 * Touch pointers get this implicitly from the browser; mouse pointers do not.
 */
function capturePointer(e: React.PointerEvent): void {
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch {
    // Synthetic events have no live pointer to capture; tracking works without it.
  }
}

function clipTouch(touch: TouchRecord, limit: number): TouchRecord | null {
  const down = Math.max(0, touch.down);
  const up = Math.min(touch.up, limit);
  return up > down ? { down, up, duration: up - down } : null;
}
