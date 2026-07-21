import { describe, it, expect } from 'vitest';
import { LEVELS, FOODS, getFood, getLevel } from './levels';

/**
 * UNIT tests for the game catalogue lookups.
 *
 * These guard the "graceful fallback" contract: an unknown id must never crash
 * the game — it resolves to a sensible default instead.
 */
describe('getFood', () => {
  it('returns the matching food by id', () => {
    const carota = getFood('carota');
    expect(carota.id).toBe('carota');
    expect(carota.label).toBe('Carota');
  });

  it('falls back to the first food for an unknown id', () => {
    expect(getFood('does-not-exist')).toBe(FOODS[0]);
  });

  it('falls back to the first food when id is undefined', () => {
    expect(getFood(undefined)).toBe(FOODS[0]);
  });
});

describe('getLevel', () => {
  it('returns the matching level by id', () => {
    expect(getLevel(2).name).toBe("L'Annusata");
  });

  it('falls back to level 1 for an unknown id', () => {
    expect(getLevel(999)).toBe(LEVELS[0]);
  });
});

describe('LEVELS data integrity', () => {
  it('defines exactly three levels with ids 1..3', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3]);
  });

  it('exposes intro and progressLabel as functions of the game state', () => {
    const level = getLevel(1);
    expect(level.intro({ foodLabel: 'Carota' })).toContain('Carota'.toLowerCase());
    expect(level.progressLabel(3, 6)).toBe('Cesto 50%');
  });
});
