import { describe, it, expect } from 'vitest';
import {
  buildAbaSeries,
  conditionOf,
  findPhaseChanges,
  groupByFood,
  wholeIntervalRecording,
} from './abaData';
import type { SavedSession } from '@/api/client';
import type { TouchRecord } from '@/types';

const touch = (down: number, up: number): TouchRecord => ({ down, up, duration: up - down });

function session(
  sessionNumber: number,
  opts: {
    food?: string;
    foodId?: string;
    difficulty?: 'facile' | 'difficile';
    levels?: { levelId: number; engagementRatio: number }[];
  } = {},
): SavedSession {
  const { food = 'Mela', foodId, difficulty = 'facile', levels = [{ levelId: 1, engagementRatio: 50 }] } = opts;
  return {
    _id: `id-${sessionNumber}`,
    childId: 'John Doe',
    sessionNumber,
    food,
    foodId,
    difficulty,
    date: `2026-07-${String(sessionNumber).padStart(2, '0')}T10:00:00.000Z`,
    createdAt: '2026-07-01T10:00:00.000Z',
    levels: levels.map((l) => ({
      levelId: l.levelId,
      levelName: `Livello ${l.levelId}`,
      behavior: 'test',
      mode: 'hold' as const,
      target: 6,
      metrics: {
        n: 1,
        latencyMs: 100,
        totalContactMs: 1000,
        meanTouchMs: 1000,
        meanIrtMs: null,
        sessionDurationMs: 2000,
        engagementRatio: l.engagementRatio,
        touches: [],
      },
    })),
  };
}

describe('groupByFood', () => {
  it('splits sessions into one group per food, ordered by first use', () => {
    const groups = groupByFood([
      session(3, { food: 'Mela' }),
      session(1, { food: 'Carota' }),
      session(2, { food: 'Mela' }),
    ]);

    expect(groups.map((g) => g.food)).toEqual(['Carota', 'Mela']);
    expect(groups[1].sessions.map((s) => s.sessionNumber)).toEqual([2, 3]);
  });

  it('keeps two foods apart even when they share a label prefix', () => {
    const groups = groupByFood([
      session(1, { food: 'Mela', foodId: 'mela' }),
      session(2, { food: 'Mela cotta', foodId: 'mela_cotta' }),
    ]);

    expect(groups).toHaveLength(2);
  });

  it('groups by food id when present, so a renamed label stays one programme', () => {
    const groups = groupByFood([
      session(1, { food: 'Mela', foodId: 'mela' }),
      session(2, { food: 'Mela rossa', foodId: 'mela' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].sessions).toHaveLength(2);
  });

  it('falls back to the label for sessions saved before food ids existed', () => {
    const groups = groupByFood([session(1, { food: 'Mela' }), session(2, { food: 'Mela' })]);

    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe('Mela');
  });

  it('returns no groups for no sessions', () => {
    expect(groupByFood([])).toEqual([]);
  });
});

describe('buildAbaSeries', () => {
  it('groups points per level and orders them by session number', () => {
    const series = buildAbaSeries([
      session(3, { levels: [{ levelId: 1, engagementRatio: 70 }] }),
      session(1, { levels: [{ levelId: 1, engagementRatio: 30 }] }),
      session(2, { levels: [{ levelId: 1, engagementRatio: 50 }] }),
    ]);

    expect(series).toHaveLength(1);
    expect(series[0].points.map((p) => p.sessionNumber)).toEqual([1, 2, 3]);
    expect(series[0].points.map((p) => p.value)).toEqual([30, 50, 70]);
  });

  it('numbers the points 1..N within the run, ignoring the session numbers', () => {
    const series = buildAbaSeries([session(2), session(5), session(9)]);

    expect(series[0].points.map((p) => p.ordinal)).toEqual([1, 2, 3]);
    expect(series[0].points.map((p) => p.sessionNumber)).toEqual([2, 5, 9]);
  });

  it('gives every level of one session the same ordinal', () => {
    const series = buildAbaSeries([
      session(4, {
        levels: [
          { levelId: 1, engagementRatio: 10 },
          { levelId: 2, engagementRatio: 20 },
        ],
      }),
    ]);

    expect(series.map((s) => s.points[0].ordinal)).toEqual([1, 1]);
  });

  it('produces one series per level, ordered by level id', () => {
    const series = buildAbaSeries([
      session(1, {
        levels: [
          { levelId: 2, engagementRatio: 40 },
          { levelId: 1, engagementRatio: 60 },
        ],
      }),
    ]);

    expect(series.map((s) => s.levelId)).toEqual([1, 2]);
  });

  it('tolerates a level missing from some sessions', () => {
    const series = buildAbaSeries([
      session(1, {
        levels: [
          { levelId: 1, engagementRatio: 10 },
          { levelId: 2, engagementRatio: 20 },
        ],
      }),
      session(2, { levels: [{ levelId: 1, engagementRatio: 30 }] }),
      session(3, {
        levels: [
          { levelId: 1, engagementRatio: 50 },
          { levelId: 2, engagementRatio: 60 },
        ],
      }),
    ]);

    const level2 = series.find((s) => s.levelId === 2);
    expect(level2?.points.map((p) => p.sessionNumber)).toEqual([1, 3]);
  });

  it('returns no series for no sessions', () => {
    expect(buildAbaSeries([])).toEqual([]);
  });
});

describe('findPhaseChanges', () => {
  it('marks a change when the food changes', () => {
    const changes = findPhaseChanges([
      session(1, { food: 'Mela' }),
      session(2, { food: 'Mela' }),
      session(3, { food: 'Carota' }),
    ]);

    expect(changes).toEqual([
      { atSessionNumber: 3, atOrdinal: 3, condition: 'Carota · facile' },
    ]);
  });

  it('marks a change when the difficulty changes for the same food', () => {
    const changes = findPhaseChanges([
      session(1, { food: 'Mela', difficulty: 'facile' }),
      session(2, { food: 'Mela', difficulty: 'difficile' }),
    ]);

    expect(changes).toEqual([
      { atSessionNumber: 2, atOrdinal: 2, condition: 'Mela · difficile' },
    ]);
  });

  it('positions the line by ordinal, not by the session number', () => {
    const changes = findPhaseChanges([
      session(4, { difficulty: 'facile' }),
      session(7, { difficulty: 'facile' }),
      session(11, { difficulty: 'difficile' }),
    ]);

    expect(changes).toEqual([
      { atSessionNumber: 11, atOrdinal: 3, condition: 'Mela · difficile' },
    ]);
  });

  it('never marks the first session as a change', () => {
    expect(findPhaseChanges([session(1)])).toEqual([]);
  });

  it('compares in session order, not array order', () => {
    const changes = findPhaseChanges([
      session(3, { food: 'Mela' }),
      session(1, { food: 'Mela' }),
      session(2, { food: 'Carota' }),
    ]);

    expect(changes.map((ch) => ch.atSessionNumber)).toEqual([2, 3]);
  });

  it('labels the condition with both food and difficulty', () => {
    expect(conditionOf(session(1, { food: 'Pera', difficulty: 'difficile' }))).toBe(
      'Pera · difficile',
    );
  });
});

describe('wholeIntervalRecording', () => {
  it('gives the grid one column per second of the window', () => {
    const record = wholeIntervalRecording([touch(0, 2500)], 6000);

    expect(record.marks).toHaveLength(6);
    expect(record.intervalMs).toBe(1000);
  });

  it('scores a second only when contact spans it entirely', () => {
    const record = wholeIntervalRecording([touch(0, 2500)], 6000);

    expect(record.marks).toEqual([true, true, false, false, false, false]);
    expect(record.observed).toBe(2);
    expect(record.percent).toBeCloseTo(33.3, 1);
  });

  it('scores a second bridged by back-to-back touches', () => {
    const record = wholeIntervalRecording([touch(0, 1000), touch(1000, 2000)], 6000);

    expect(record.marks.slice(0, 3)).toEqual([true, true, false]);
  });

  it('does not score a second with a release in the middle', () => {
    const record = wholeIntervalRecording([touch(0, 500), touch(510, 2000)], 6000);

    expect(record.marks[0]).toBe(false);
    expect(record.marks[1]).toBe(true);
  });

  it('scores every second for uninterrupted contact', () => {
    const record = wholeIntervalRecording([touch(0, 6000)], 6000);

    expect(record.observed).toBe(6);
    expect(record.percent).toBe(100);
  });

  it('returns an all-empty grid with no contact', () => {
    const record = wholeIntervalRecording([], 6000);

    expect(record.marks).toEqual([false, false, false, false, false, false]);
    expect(record.observed).toBe(0);
    expect(record.percent).toBe(0);
  });

  it('never scores anything for a zero-length level', () => {
    const record = wholeIntervalRecording([touch(0, 0)], 0);

    expect(record.marks).toEqual([]);
    expect(record.percent).toBe(0);
  });

  it('rounds a window that is not a whole number of seconds', () => {
    const record = wholeIntervalRecording([touch(0, 6000)], 6040);

    expect(record.marks).toHaveLength(6);
  });

  it('honours a custom interval length', () => {
    const record = wholeIntervalRecording([touch(0, 500)], 1000, 250);

    expect(record.marks).toEqual([true, true, false, false]);
    expect(record.percent).toBe(50);
  });
});
