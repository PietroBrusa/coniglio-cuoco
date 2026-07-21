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

/** A snapshot with the boring fields filled in. */
const snapshot = (partial: Partial<Snapshot>): Snapshot => ({
  touches: [],
  downAt: null,
  start: 0,
  now: 0,
  latency: null,
  ...partial,
});

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

  it('computes total and mean contact from completed taps', () => {
    const m = computeMetrics(
      snapshot({ touches: [tap(500, 900), tap(1400, 1600)], now: 2000 }), // 400, 200
    );

    expect(m.count).toBe(2);
    expect(m.totalContactMs).toBe(600); // 400 + 200
    expect(m.meanTouchMs).toBe(300); // 600 / 2
  });

  it('reports the latency measured before the window opened', () => {
    // The window is anchored to the first contact, so the first touch always
    // starts at 0 inside it: the wait that preceded it has to be carried
    // separately or it is lost.
    const m = computeMetrics(snapshot({ touches: [tap(0, 900)], now: 2000, latency: 1400 }));

    expect(m.latencyMs).toBe(1400);
  });

  it('leaves latency null when the child never made contact', () => {
    expect(computeMetrics(snapshot({ now: 5000 })).latencyMs).toBeNull();
  });

  it('computes mean inter-response time (gap between release and next press)', () => {
    // release@900 → next press@1400 ⇒ IRT 500 (only one gap, so mean = 500)
    const m = computeMetrics(snapshot({ touches: [tap(500, 900), tap(1400, 1600)], now: 2000 }));

    expect(m.meanIrtMs).toBe(500);
  });

  it('leaves meanIrtMs null with a single tap (no gap to measure)', () => {
    expect(computeMetrics(snapshot({ touches: [tap(0, 100)], now: 500 })).meanIrtMs).toBeNull();
  });

  it('includes an ongoing (still-pressed) tap in liveContactMs but not totalContactMs', () => {
    const m = computeMetrics(
      snapshot({
        touches: [tap(0, 100)], // 100ms completed
        downAt: 400, // currently held since 400
        now: 600, // ...for 200ms so far
      }),
    );

    expect(m.totalContactMs).toBe(100);
    expect(m.liveContactMs).toBe(300); // 100 completed + 200 ongoing
  });

  it('derives engagementRatio as a percentage of the session duration', () => {
    const m = computeMetrics(
      snapshot({
        touches: [tap(0, 500)], // 500ms in contact
        start: 1000, // window opened at 1000...
        now: 2000, // ...so it has run for 1000ms
      }),
    );

    expect(m.engagementRatio).toBe(50);
  });

  it('honours an explicit sessionDuration override', () => {
    // This is how a level scores itself: against its whole window, not against
    // however long it took the closing timer to fire.
    const m = computeMetrics(snapshot({ touches: [tap(0, 250)], now: 999 }), 1000);

    expect(m.sessionDurationMs).toBe(1000);
    expect(m.engagementRatio).toBe(25); // 250 / 1000
  });

  it('never reports more than 100% engagement', () => {
    // A press still down when the window closes can be timed a hair past it.
    const m = computeMetrics(snapshot({ touches: [tap(0, 6012)], now: 6012 }), 6000);

    expect(m.engagementRatio).toBe(100);
  });

  it('scores zero engagement for a window the child never touched', () => {
    const m = computeMetrics(snapshot({ now: 6000 }), 6000);

    expect(m.engagementRatio).toBe(0);
    expect(m.totalContactMs).toBe(0);
  });
});
