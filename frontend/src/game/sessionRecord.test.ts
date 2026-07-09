import { describe, it, expect } from 'vitest';
import { createSession, addLevelResult } from './sessionRecord';
import type { Level, Metrics, Session } from '../types';

/**
 * UNIT tests for the immutable session-record builders.
 *
 * These pure functions build the domain object persisted to the backend. Beyond
 * the happy path, they guard two contracts: sensible fallbacks for missing
 * metadata, and strict immutability (the input session is never mutated).
 */

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

describe('createSession', () => {
  it('builds an empty session from the given metadata', () => {
    const s = createSession({
      childId: 'B001',
      sessionNumber: 3,
      foodLabel: 'Carota',
      difficulty: 'facile',
    });
    expect(s.childId).toBe('B001');
    expect(s.sessionNumber).toBe(3);
    expect(s.food).toBe('Carota');
    expect(s.difficulty).toBe('facile');
    expect(s.levels).toEqual([]);
    expect(typeof s.date).toBe('string');
  });

  it('applies sensible fallbacks for empty child id and session number', () => {
    const s = createSession({
      childId: '',
      sessionNumber: 0,
      foodLabel: 'Mela',
      difficulty: 'difficile',
    });
    expect(s.childId).toBe('anonimo');
    expect(s.sessionNumber).toBe(1);
  });
});

describe('addLevelResult', () => {
  it('appends a level result, mapping live "count" to persisted "n"', () => {
    const base = createSession({
      childId: 'B001',
      sessionNumber: 1,
      foodLabel: 'Carota',
      difficulty: 'facile',
    });

    const next = addLevelResult(base, { level, metrics });

    expect(next.levels).toHaveLength(1);
    const result = next.levels[0];
    expect(result.levelId).toBe(2);
    expect(result.levelName).toBe("L'Annusata");
    expect(result.metrics.n).toBe(4); // count → n
    expect(result.metrics).not.toHaveProperty('count');
    expect(result.metrics).not.toHaveProperty('liveContactMs');
  });

  it('never mutates the input session (immutability)', () => {
    const base: Session = createSession({
      childId: 'B001',
      sessionNumber: 1,
      foodLabel: 'Carota',
      difficulty: 'facile',
    });

    const next = addLevelResult(base, { level, metrics });

    expect(base.levels).toHaveLength(0); // original untouched
    expect(next).not.toBe(base); // a new object is returned
  });
});
