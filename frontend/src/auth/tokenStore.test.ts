import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getToken, getStoredChild, setAuth, clearAuth } from './tokenStore';

/**
 * UNIT tests for the token store (the single source of truth for auth state).
 * `localStorage` does not exist in the Node unit environment, so we inject a
 * small in-memory fake (a "fake" test double).
 */

function createLocalStorageFake(): Storage {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: () => {
      store = {};
    },
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createLocalStorageFake());
});

describe('tokenStore', () => {
  it('returns null when nothing is stored', () => {
    expect(getToken()).toBeNull();
    expect(getStoredChild()).toBeNull();
  });

  it('persists and reads back token and child on setAuth', () => {
    setAuth('jwt.token.value', 'B001');
    expect(getToken()).toBe('jwt.token.value');
    expect(getStoredChild()).toBe('B001');
  });

  it('clears both token and child on clearAuth', () => {
    setAuth('jwt.token.value', 'B001');
    clearAuth();
    expect(getToken()).toBeNull();
    expect(getStoredChild()).toBeNull();
  });
});
