import { describe, it, expect } from 'vitest';
import { sampleBeatMs, isHeldThrough, HOLD_EARLY_MS, HOLD_GRACE_MS } from './hardBeat';
import { getLevel } from './levels';

/**
 * UNIT tests for the hard-mode beat rules.
 *
 * These guard the two properties the mechanic rests on: level 1 keeps a fixed
 * cadence while levels 2 and 3 randomise both the wait and the required hold,
 * and a `hold` window scores only for a single press that spans it.
 */
describe('sampleBeatMs', () => {
  it('returns the fixed value when min equals max (level 1 cadence)', () => {
    expect(sampleBeatMs([600, 600])).toBe(600);
  });

  it('interpolates the range with the injected randomness', () => {
    expect(sampleBeatMs([600, 1400], () => 0)).toBe(600);
    expect(sampleBeatMs([600, 1400], () => 0.5)).toBe(1000);
  });

  it('stays inside the range over many samples', () => {
    for (let i = 0; i < 500; i += 1) {
      const ms = sampleBeatMs([900, 2000]);
      expect(ms).toBeGreaterThanOrEqual(900);
      expect(ms).toBeLessThanOrEqual(2000);
    }
  });
});

describe('isHeldThrough', () => {
  const openedAt = 10_000;

  it('scores a press that starts with the window and is still down at close', () => {
    expect(isHeldThrough(openedAt, openedAt)).toBe(true);
  });

  it('allows a reaction delay within the grace period', () => {
    expect(isHeldThrough(openedAt, openedAt + HOLD_GRACE_MS)).toBe(true);
    expect(isHeldThrough(openedAt, openedAt + HOLD_GRACE_MS + 1)).toBe(false);
  });

  it('allows a slightly anticipated press', () => {
    expect(isHeldThrough(openedAt, openedAt - HOLD_EARLY_MS)).toBe(true);
  });

  it('rejects a release before the window closes', () => {
    expect(isHeldThrough(openedAt, null)).toBe(false);
  });

  it('rejects a press held since long before the window (no free ride)', () => {
    expect(isHeldThrough(openedAt, openedAt - 3000)).toBe(false);
  });
});

describe('LEVELS hard-beat configuration', () => {
  it('keeps level 1 on a fixed tap cadence', () => {
    const { hardBeat } = getLevel(1);
    expect(hardBeat.score).toBe('tap');
    expect(hardBeat.onMs[0]).toBe(hardBeat.onMs[1]);
    expect(hardBeat.offMs[0]).toBe(hardBeat.offMs[1]);
  });

  it.each([2, 3])('randomises wait and hold on level %i', (id) => {
    const { hardBeat } = getLevel(id);
    expect(hardBeat.score).toBe('hold');
    expect(hardBeat.onMs[0]).toBeLessThan(hardBeat.onMs[1]);
    expect(hardBeat.offMs[0]).toBeLessThan(hardBeat.offMs[1]);
  });

  it('makes level 3 demand longer holds than level 2', () => {
    expect(getLevel(3).hardBeat.onMs[1]).toBeGreaterThan(getLevel(2).hardBeat.onMs[1]);
  });
});
