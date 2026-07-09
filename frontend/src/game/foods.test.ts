import { describe, it, expect } from 'vitest';
import { FOODS } from './foods';

/**
 * UNIT tests guarding the integrity of the food catalogue.
 *
 * The catalogue is hand-maintained data: these tests are cheap insurance
 * against regressions such as a duplicated id (which would make previously
 * saved sessions resolve to the wrong food) or an empty label/emoji.
 */
describe('FOODS catalogue', () => {
  it('is non-empty', () => {
    expect(FOODS.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const ids = FOODS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('preserves the original first five ids (backwards compatibility)', () => {
    // These ids must keep resolving so older saved sessions stay valid.
    for (const id of ['carota', 'mela', 'broccolo', 'pomodoro', 'banana']) {
      expect(FOODS.some((f) => f.id === id)).toBe(true);
    }
  });

  it('every entry has a non-empty id, label and emoji', () => {
    for (const f of FOODS) {
      expect(f.id.trim().length).toBeGreaterThan(0);
      expect(f.label.trim().length).toBeGreaterThan(0);
      expect(f.emoji.trim().length).toBeGreaterThan(0);
    }
  });
});
