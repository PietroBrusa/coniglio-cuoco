import { describe, it, expect, vi } from 'vitest';
import { getFood } from './levels';
import { FOODS } from './foods';

/**
 * UNIT test demonstrating MODULE MOCKING (vi.mock), mirroring the theory's
 * `calculate`→`sum` example.
 *
 * `levels.ts` depends on the real (large) food catalogue in `./foods`. Here we
 * replace that whole module with a tiny, controlled fake so the lookup logic in
 * `getFood` is tested in isolation from the actual data — the test no longer
 * cares how many real foods exist, only that the resolution/fallback rules hold.
 *
 * `vi.mock` is hoisted above the imports, so `getFood` sees the fake catalogue.
 */
vi.mock('./foods', () => ({
  FOODS: [
    { id: 'test-a', label: 'Test A', emoji: '🅰️' },
    { id: 'test-b', label: 'Test B', emoji: '🅱️' },
  ],
}));

describe('getFood with a mocked catalogue', () => {
  it('uses the injected (mocked) module, not the real data', () => {
    // Proves the mock is in effect: the real catalogue has ~100 entries.
    expect(FOODS).toHaveLength(2);
  });

  it('resolves an id against the mocked catalogue', () => {
    expect(getFood('test-b')).toEqual({ id: 'test-b', label: 'Test B', emoji: '🅱️' });
  });

  it('falls back to the first item of the mocked catalogue', () => {
    expect(getFood('unknown')).toEqual(FOODS[0]);
  });
});
