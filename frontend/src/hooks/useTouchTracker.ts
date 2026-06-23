import { useCallback, useEffect, useRef, useState } from 'react';
import type { Metrics, TouchRecord } from '../types';

/**
 * Touch measurement engine — the clinical core of the application.
 * Unifies two input sources (keyboard via Makey-Makey and pointer/mouse/touch)
 * and computes the behavioural metrics defined in the project specification.
 */

/** Keyboard codes treated as a "touch" event (Makey-Makey default mapping). */
export const MAKEY_KEYS = [
  'Space',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Enter',
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyF',
  'KeyG',
];

interface Snapshot {
  touches: TouchRecord[];
  downAt: number | null;
  start: number;
  now: number;
}

const emptySnap = (): Snapshot => ({ touches: [], downAt: null, start: 0, now: 0 });

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

  const getResult = useCallback(
    (sessionDurationMs?: number) =>
      computeMetrics(
        {
          touches: touchesRef.current,
          downAt: null,
          start: startRef.current,
          now: performance.now(),
        },
        sessionDurationMs
      ),
    []
  );

  return {
    metrics: computeMetrics(snap),
    isDown: snap.downAt !== null,
    pointerHandlers,
    reset,
    getResult,
  };
}

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
function computeMetrics(
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
