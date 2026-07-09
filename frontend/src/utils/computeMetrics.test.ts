import { describe, it, expect } from 'vitest';
import { computeMetrics, emptySnap, type Snapshot } from './computeMetrics';
import type { TouchRecord } from '../types';

/**
 * UNIT tests for the pure metric engine.
 *
 * `computeMetrics` is deliberately React-free, so it can be tested in complete
 * isolation with plain input/output assertions — the textbook example of a unit
 * test: deterministic, no DOM, no timers, no mocks.
 */

/** Convenience: builds a completed touch from press/release timestamps. */
const tap = (down: number, up: number): TouchRecord => ({ down, up, duration: up - down });

describe('computeMetrics', () => {
  it('returns a zeroed result for an empty snapshot', () => {
    const m = computeMetrics(emptySnap());
    expect(m.count).toBe(0);
    expect(m.latencyMs).toBeNull();
    expect(m.totalContactMs).toBe(0);
    expect(m.meanTouchMs).toBeNull();
    expect(m.meanIrtMs).toBeNull();
    expect(m.engagementRatio).toBe(0);
  });

  it('computes latency and total/mean contact from completed taps', () => {
    const snap: Snapshot = {
      touches: [tap(500, 900), tap(1400, 1600)], // durations 400, 200
      downAt: null,
      start: 0,
      now: 2000,
    };
    const m = computeMetrics(snap);

    expect(m.count).toBe(2);
    expect(m.latencyMs).toBe(500); // first press
    expect(m.totalContactMs).toBe(600); // 400 + 200
    expect(m.meanTouchMs).toBe(300); // 600 / 2
  });

  it('computes mean inter-response time (gap between release and next press)', () => {
    // release@900 → next press@1400 ⇒ IRT 500 (only one gap, so mean = 500)
    const snap: Snapshot = {
      touches: [tap(500, 900), tap(1400, 1600)],
      downAt: null,
      start: 0,
      now: 2000,
    };
    expect(computeMetrics(snap).meanIrtMs).toBe(500);
  });

  it('leaves meanIrtMs null with a single tap (no gap to measure)', () => {
    const snap: Snapshot = { touches: [tap(0, 100)], downAt: null, start: 0, now: 500 };
    expect(computeMetrics(snap).meanIrtMs).toBeNull();
  });

  it('includes an ongoing (still-pressed) tap in liveContactMs but not totalContactMs', () => {
    const snap: Snapshot = {
      touches: [tap(0, 100)], // 100ms completed
      downAt: 400, // currently held since 400
      start: 0,
      now: 600, // ...for 200ms so far
    };
    const m = computeMetrics(snap);
    expect(m.totalContactMs).toBe(100);
    expect(m.liveContactMs).toBe(300); // 100 completed + 200 ongoing
  });

  it('derives engagementRatio as a percentage of the session duration', () => {
    const snap: Snapshot = {
      touches: [tap(0, 500)], // 500ms in contact
      downAt: null,
      start: 1000, // session started at 1000...
      now: 2000, // ...duration is 1000ms
    };
    expect(computeMetrics(snap).engagementRatio).toBe(50);
  });

  it('honours an explicit sessionDuration override', () => {
    const snap: Snapshot = { touches: [tap(0, 250)], downAt: null, start: 0, now: 999 };
    const m = computeMetrics(snap, 1000);
    expect(m.sessionDurationMs).toBe(1000);
    expect(m.engagementRatio).toBe(25); // 250 / 1000
  });
});
