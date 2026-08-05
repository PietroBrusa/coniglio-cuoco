import { describe, it, expect } from 'vitest';
import { computeMetrics, emptySnap, type Snapshot } from './computeMetrics';
import type { TouchRecord } from '@/types';

const tap = (down: number, up: number): TouchRecord => ({ down, up, duration: up - down });

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
      snapshot({ touches: [tap(500, 900), tap(1400, 1600)], now: 2000 }),
    );

    expect(m.count).toBe(2);
    expect(m.totalContactMs).toBe(600);
    expect(m.meanTouchMs).toBe(300);
  });

  it('reports the latency measured before the window opened', () => {
    const m = computeMetrics(snapshot({ touches: [tap(0, 900)], now: 2000, latency: 1400 }));

    expect(m.latencyMs).toBe(1400);
  });

  it('leaves latency null when the child never made contact', () => {
    expect(computeMetrics(snapshot({ now: 5000 })).latencyMs).toBeNull();
  });

  it('computes mean inter-response time (gap between release and next press)', () => {
    const m = computeMetrics(snapshot({ touches: [tap(500, 900), tap(1400, 1600)], now: 2000 }));

    expect(m.meanIrtMs).toBe(500);
  });

  it('leaves meanIrtMs null with a single tap (no gap to measure)', () => {
    expect(computeMetrics(snapshot({ touches: [tap(0, 100)], now: 500 })).meanIrtMs).toBeNull();
  });

  it('includes an ongoing (still-pressed) tap in liveContactMs but not totalContactMs', () => {
    const m = computeMetrics(
      snapshot({
        touches: [tap(0, 100)],
        downAt: 400,
        now: 600,
      }),
    );

    expect(m.totalContactMs).toBe(100);
    expect(m.liveContactMs).toBe(300);
  });

  it('derives engagementRatio as a percentage of the session duration', () => {
    const m = computeMetrics(
      snapshot({
        touches: [tap(0, 500)],
        start: 1000,
        now: 2000,
      }),
    );

    expect(m.engagementRatio).toBe(50);
  });

  it('honours an explicit sessionDuration override', () => {
    const m = computeMetrics(snapshot({ touches: [tap(0, 250)], now: 999 }), 1000);

    expect(m.sessionDurationMs).toBe(1000);
    expect(m.engagementRatio).toBe(25);
  });

  it('never reports more than 100% engagement', () => {
    const m = computeMetrics(snapshot({ touches: [tap(0, 6012)], now: 6012 }), 6000);

    expect(m.engagementRatio).toBe(100);
  });

  it('scores zero engagement for a window the child never touched', () => {
    const m = computeMetrics(snapshot({ now: 6000 }), 6000);

    expect(m.engagementRatio).toBe(0);
    expect(m.totalContactMs).toBe(0);
  });
});
