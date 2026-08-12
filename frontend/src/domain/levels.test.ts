import { describe, it, expect } from 'vitest';
import { LEVELS, FOODS, getFood } from './levels';

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

describe('LEVELS data integrity', () => {
  it('defines exactly three levels with ids 1..3', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3]);
  });

  it('names the second step of the hierarchy', () => {
    expect(LEVELS[1].name).toBe("L'Annusata");
  });

  it('exposes intro and progressLabel as functions of the game state', () => {
    const level = LEVELS[0];
    expect(level.intro({ foodLabel: 'Carota' })).toContain('Carota'.toLowerCase());
    expect(level.progressLabel(3, 6)).toBe('Cesto 50%');
  });
});
