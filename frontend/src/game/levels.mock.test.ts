import { describe, it, expect, vi } from 'vitest';
import { getFood } from './levels';
import { FOODS } from './foods';

vi.mock('./foods', () => ({
  FOODS: [
    { id: 'test-a', label: 'Test A', emoji: '🅰️' },
    { id: 'test-b', label: 'Test B', emoji: '🅱️' },
  ],
}));

describe('getFood with a mocked catalogue', () => {
  it('uses the injected (mocked) module, not the real data', () => {
    expect(FOODS).toHaveLength(2);
  });

  it('resolves an id against the mocked catalogue', () => {
    expect(getFood('test-b')).toEqual({ id: 'test-b', label: 'Test B', emoji: '🅱️' });
  });

  it('falls back to the first item of the mocked catalogue', () => {
    expect(getFood('unknown')).toEqual(FOODS[0]);
  });
});
