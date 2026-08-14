import { describe, it, expect } from 'vitest';
import { foodProgress, nextSessionNumber } from './foodProgress';
import type { SavedSession } from '@/api/client';

function session(
  sessionNumber: number,
  opts: { food?: string; foodId?: string; date?: string } = {},
): SavedSession {
  const {
    food = 'Mela',
    foodId = food.toLowerCase(),
    date = `2026-07-${String(sessionNumber).padStart(2, '0')}T10:00:00.000Z`,
  } = opts;
  return {
    _id: `id-${food}-${sessionNumber}`,
    childId: 'John Doe',
    sessionNumber,
    food,
    foodId,
    difficulty: 'facile',
    therapist: 'Anna',
    problemBehaviors: [],
    notes: '',
    date,
    createdAt: date,
    levels: [],
  };
}

describe('foodProgress', () => {
  it('tracks the highest session number reached on each food', () => {
    const progress = foodProgress([
      session(1, { food: 'Mela', foodId: 'mela' }),
      session(2, { food: 'Mela', foodId: 'mela' }),
      session(1, { food: 'Banana', foodId: 'banana' }),
    ]);

    expect(progress.mela.lastSessionNumber).toBe(2);
    expect(progress.mela.total).toBe(2);
    expect(progress.banana.lastSessionNumber).toBe(1);
    expect(progress.banana.total).toBe(1);
  });

  it('keeps the date of the highest-numbered session, not the last one seen', () => {
    const progress = foodProgress([
      session(4, { foodId: 'mela', date: '2026-05-04T10:00:00.000Z' }),
      session(2, { foodId: 'mela', date: '2026-05-02T10:00:00.000Z' }),
    ]);

    expect(progress.mela.lastSessionNumber).toBe(4);
    expect(progress.mela.lastDate).toBe('2026-05-04T10:00:00.000Z');
  });

  it('groups by food id, so a renamed label stays one programme', () => {
    const progress = foodProgress([
      session(3, { food: 'Banana', foodId: 'banana' }),
      session(4, { food: 'Banana matura', foodId: 'banana' }),
    ]);

    expect(progress.banana).toEqual({
      lastSessionNumber: 4,
      lastDate: '2026-07-04T10:00:00.000Z',
      total: 2,
    });
  });

  it('returns nothing for an empty history', () => {
    expect(foodProgress([])).toEqual({});
  });
});

describe('nextSessionNumber', () => {
  it('proposes 1 for a food never used with this child', () => {
    expect(nextSessionNumber(undefined)).toBe(1);
  });

  it('proposes the session after the last one reached', () => {
    expect(nextSessionNumber({ lastSessionNumber: 7, lastDate: '', total: 7 })).toBe(8);
  });
});
