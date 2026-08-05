import { describe, it, expect } from 'vitest';
import { computeStars } from './stars';
import { DEFAULT_SETTINGS } from '@/storage/settings';
import type { Level, Metrics } from '@/types';

const holdLevel = { id: 2, mode: 'hold' } as Level;
const countLevel = { id: 1, mode: 'count' } as Level;

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
    const stars = computeStars(metrics({}), holdLevel, 'facile', DEFAULT_SETTINGS);
    expect(stars).toBe(1);
  });

  it('adds a star for a prompt approach (latency within threshold)', () => {
    const stars = computeStars(
      metrics({ latencyMs: DEFAULT_SETTINGS.promptLatencyMs - 1 }),
      holdLevel,
      'facile',
      DEFAULT_SETTINGS,
    );
    expect(stars).toBe(2);
  });

  it('does not add the prompt star when latency exceeds the threshold', () => {
    const stars = computeStars(
      metrics({ latencyMs: DEFAULT_SETTINGS.promptLatencyMs + 1 }),
      holdLevel,
      'facile',
      DEFAULT_SETTINGS,
    );
    expect(stars).toBe(1);
  });

  it('hold mechanic: uses engagement ratio for the sustained-contact star', () => {
    const engaged = computeStars(
      metrics({ engagementRatio: DEFAULT_SETTINGS.holdEngagementPct }),
      holdLevel,
      'facile',
      DEFAULT_SETTINGS,
    );
    expect(engaged).toBe(2);

    const notEngaged = computeStars(
      metrics({ engagementRatio: DEFAULT_SETTINGS.holdEngagementPct - 1 }),
      holdLevel,
      'facile',
      DEFAULT_SETTINGS,
    );
    expect(notEngaged).toBe(1);
  });

  it('count level forces the "tap" mechanic even on "facile" (uses contact time)', () => {
    const stars = computeStars(
      metrics({ totalContactMs: DEFAULT_SETTINGS.tapContactMs }),
      countLevel,
      'facile',
      DEFAULT_SETTINGS,
    );
    expect(stars).toBe(2);
  });

  it('"difficile" forces the "tap" mechanic even on a hold level', () => {
    const stars = computeStars(
      metrics({ engagementRatio: 100, totalContactMs: 0 }),
      holdLevel,
      'difficile',
      DEFAULT_SETTINGS,
    );
    expect(stars).toBe(1);
  });

  it('caps the rating at 3 stars', () => {
    const stars = computeStars(
      metrics({ latencyMs: 0, engagementRatio: 100 }),
      holdLevel,
      'facile',
      DEFAULT_SETTINGS,
    );
    expect(stars).toBe(3);
  });

  it('respects custom operator thresholds', () => {
    const strict = { ...DEFAULT_SETTINGS, promptLatencyMs: 1000 };
    const stars = computeStars(metrics({ latencyMs: 2000 }), holdLevel, 'facile', strict);
    expect(stars).toBe(1);
  });
});
