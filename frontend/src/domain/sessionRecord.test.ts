import { describe, it, expect } from 'vitest';
import { createSession, addLevelResult, collectsData } from './sessionRecord';
import type { Level, Metrics, Session } from '@/types';

const level = {
  id: 2,
  name: "L'Annusata",
  behavior: 'Sollevare e avvicinare al viso',
  mode: 'hold',
  target: 6,
} as Level;

const metrics = {
  count: 4,
  latencyMs: 700,
  totalContactMs: 2000,
  liveContactMs: 2000,
  meanTouchMs: 500,
  meanIrtMs: 300,
  sessionDurationMs: 8000,
  engagementRatio: 25,
  touches: [{ down: 0, up: 500, duration: 500 }],
} as Metrics;

describe('collectsData', () => {
  it('records an easy session and treats a hard one as play only', () => {
    expect(collectsData('facile')).toBe(true);
    expect(collectsData('difficile')).toBe(false);
  });

  it('records a session saved before the difficulty existed', () => {
    expect(collectsData(undefined)).toBe(true);
  });
});

describe('createSession', () => {
  it('builds an empty session from the given metadata', () => {
    const s = createSession({
      childId: 'B001',
      sessionNumber: 3,
      foodId: 'carota',
      difficulty: 'facile',
    });
    expect(s.childId).toBe('B001');
    expect(s.sessionNumber).toBe(3);
    expect(s.foodId).toBe('carota');
    expect(s.food).toBe('Carota');
    expect(s.difficulty).toBe('facile');
    expect(s.levels).toEqual([]);
    expect(typeof s.date).toBe('string');
  });

  it('applies sensible fallbacks for empty child id and session number', () => {
    const s = createSession({
      childId: '',
      sessionNumber: 0,
      foodId: 'mela',
      difficulty: 'difficile',
    });
    expect(s.childId).toBe('anonimo');
    expect(s.sessionNumber).toBe(1);
  });
});

describe('addLevelResult', () => {
  it('appends a level result, keeping "count" and dropping "liveContactMs"', () => {
    const base = createSession({
      childId: 'B001',
      sessionNumber: 1,
      foodId: 'carota',
      difficulty: 'facile',
    });

    const next = addLevelResult(base, { level, metrics });

    expect(next.levels).toHaveLength(1);
    const result = next.levels[0];
    expect(result.levelId).toBe(2);
    expect(result.levelName).toBe("L'Annusata");
    expect(result.metrics.count).toBe(4);
    expect(result.metrics).not.toHaveProperty('liveContactMs');
  });

  it('never mutates the input session (immutability)', () => {
    const base: Session = createSession({
      childId: 'B001',
      sessionNumber: 1,
      foodId: 'carota',
      difficulty: 'facile',
    });

    const next = addLevelResult(base, { level, metrics });

    expect(base.levels).toHaveLength(0);
    expect(next).not.toBe(base);
  });
});
