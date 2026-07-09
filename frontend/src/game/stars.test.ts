import { describe, it, expect } from 'vitest';
import { computeStars } from './stars';
import { DEFAULT_SETTINGS } from './settings';
import type { Level, Metrics } from '../types';

/**
 * UNIT tests for the star-rating rules.
 *
 * The scoring depends on the level mechanic ("tap" vs "hold"), the difficulty
 * and the operator-configurable thresholds, so the tests are organised to cover
 * each branch. Fixtures are built with small helpers to keep every case
 * readable and focused on the single variable under test.
 */

const holdLevel = { id: 2, mode: 'hold' } as Level;
const countLevel = { id: 1, mode: 'count' } as Level;

/** Builds a Metrics object; only the fields the rating reads need to be set. */
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
    expect(engaged).toBe(2); // engagement star, no prompt star

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
    // High engagement would earn a star in hold mode, but difficile switches to
    // the tap mechanic, which looks at totalContactMs instead — here too low.
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
    // Tighten the prompt threshold so a 2s latency no longer qualifies.
    const strict = { ...DEFAULT_SETTINGS, promptLatencyMs: 1000 };
    const stars = computeStars(metrics({ latencyMs: 2000 }), holdLevel, 'facile', strict);
    expect(stars).toBe(1);
  });
});
