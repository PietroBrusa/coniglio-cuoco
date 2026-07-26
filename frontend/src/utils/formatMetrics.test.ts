import { describe, it, expect } from 'vitest';
import { formatMetrics } from './formatMetrics';
import type { LevelResult } from '../types';

const level: LevelResult = {
  levelId: 1,
  levelName: 'La Raccolta',
  behavior: 'Approccio e contatto con le dita',
  mode: 'hold',
  target: 6,
  metrics: {
    n: 3,
    latencyMs: 800,
    totalContactMs: 1500,
    meanTouchMs: 500,
    meanIrtMs: 250,
    sessionDurationMs: 5000,
    engagementRatio: 30,
    touches: [],
  },
};

describe('formatMetrics', () => {
  it('labels every metric with human-readable units', () => {
    const rows = formatMetrics(level.metrics);
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));

    expect(byLabel['Tocchi (n)']).toBe(3);
    expect(byLabel['Latenza 1° tocco']).toBe('0.80 s');
    expect(byLabel['Durata sessione']).toBe('5.00 s');
    expect(byLabel['Engagement Ratio']).toBe('30.0 %');
  });

  it('renders a dash for null values (e.g. no taps recorded)', () => {
    const rows = formatMetrics({ ...level.metrics, latencyMs: null, meanIrtMs: null });
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));

    expect(byLabel['Latenza 1° tocco']).toBe('—');
    expect(byLabel['IRT medio']).toBe('—');
  });

  it('accepts live metrics that use "count" instead of "n"', () => {
    const rows = formatMetrics({
      count: 7,
      latencyMs: 0,
      totalContactMs: 0,
      meanTouchMs: null,
      meanIrtMs: null,
      sessionDurationMs: 0,
      engagementRatio: 0,
    });
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));
    expect(byLabel['Tocchi (n)']).toBe(7);
  });
});
