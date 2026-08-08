import { describe, it, expect } from 'vitest';
import { computeStars } from './stars';
import { DEFAULT_SETTINGS } from '@/storage/settings';
import type { Level, Metrics } from '@/types';

const holdLevel = { id: 2, mode: 'hold', hardBeat: { beatTarget: 2 } } as Level;

const metrics = (partial: Partial<Metrics>): Metrics =>
  ({
    count: 0,
    latencyMs: null,
    totalContactMs: 0,
    liveContactMs: 0,
    meanTouchMs: null,
    meanIrtMs: null,
    sessionDurationMs: 0,
    engagementRatio: 0,
    touches: [],
    ...partial,
  }) as Metrics;

describe('computeStars', () => {
  it('always awards at least 1 star for completing the level', () => {
    const stars = computeStars(metrics({}), holdLevel, DEFAULT_SETTINGS, null);
    expect(stars).toBe(1);
  });

  it('adds a star for a prompt approach (latency within threshold)', () => {
    const stars = computeStars(
      metrics({ latencyMs: DEFAULT_SETTINGS.promptLatencyMs - 1 }),
      holdLevel,
      DEFAULT_SETTINGS,
      null,
    );
    expect(stars).toBe(2);
  });

  it('does not add the prompt star when latency exceeds the threshold', () => {
    const stars = computeStars(
      metrics({ latencyMs: DEFAULT_SETTINGS.promptLatencyMs + 1 }),
      holdLevel,
      DEFAULT_SETTINGS,
      null,
    );
    expect(stars).toBe(1);
  });

  it('easy mode: uses engagement ratio for the third star', () => {
    const engaged = computeStars(
      metrics({ engagementRatio: DEFAULT_SETTINGS.holdEngagementPct }),
      holdLevel,
      DEFAULT_SETTINGS,
      null,
    );
    expect(engaged).toBe(2);

    const notEngaged = computeStars(
      metrics({ engagementRatio: DEFAULT_SETTINGS.holdEngagementPct - 1 }),
      holdLevel,
      DEFAULT_SETTINGS,
      null,
    );
    expect(notEngaged).toBe(1);
  });

  it('hard mode: uses the beats scored for the third star', () => {
    const onTarget = computeStars(metrics({}), holdLevel, DEFAULT_SETTINGS, 2);
    expect(onTarget).toBe(2);

    const short = computeStars(metrics({}), holdLevel, DEFAULT_SETTINGS, 1);
    expect(short).toBe(1);
  });

  it('hard mode: holding the contact throughout earns no star on its own', () => {
    // Il caso da non premiare: contatto pieno, nessuna finestra centrata.
    const stars = computeStars(
      metrics({ engagementRatio: 100, totalContactMs: 6000 }),
      holdLevel,
      DEFAULT_SETTINGS,
      0,
    );
    expect(stars).toBe(1);
  });

  it('caps the rating at 3 stars', () => {
    const stars = computeStars(
      metrics({ latencyMs: 0, engagementRatio: 100 }),
      holdLevel,
      DEFAULT_SETTINGS,
      null,
    );
    expect(stars).toBe(3);
  });

  it('respects custom operator thresholds', () => {
    const strict = { ...DEFAULT_SETTINGS, promptLatencyMs: 1000 };
    const stars = computeStars(metrics({ latencyMs: 2000 }), holdLevel, strict, null);
    expect(stars).toBe(1);
  });
});
