import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getToken,
  getStoredChild,
  setAuth,
  clearAuth,
  onAuthCleared,
  isSessionExpired,
} from './tokenStore';

function jwtExpiring(atMs: number): string {
  const payload = btoa(JSON.stringify({ sub: 'B001', exp: Math.floor(atMs / 1000) }));
  return `header.${payload}.signature`;
}

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

  it('notifies subscribers when the auth is cleared, and stops after unsubscribing', () => {
    const listener = vi.fn();
    const unsubscribe = onAuthCleared(listener);

    clearAuth();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    clearAuth();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

function createThrowingLocalStorage(): Storage {
  const boom = () => {
    throw new Error('storage unavailable');
  };
  return {
    get length() {
      return boom();
    },
    clear: boom,
    getItem: boom,
    setItem: boom,
    removeItem: boom,
    key: boom,
  };
}

describe('when localStorage throws (e.g. private browsing, a locked-down device)', () => {
  it('reads and writes without crashing', () => {
    vi.stubGlobal('localStorage', createThrowingLocalStorage());

    expect(() => getToken()).not.toThrow();
    expect(getToken()).toBeNull();
    expect(() => getStoredChild()).not.toThrow();
    expect(getStoredChild()).toBeNull();
    expect(() => setAuth('jwt.token.value', 'B001')).not.toThrow();
  });

  it('still notifies subscribers on clearAuth even though the storage removal fails', () => {
    vi.stubGlobal('localStorage', createThrowingLocalStorage());
    const listener = vi.fn();
    const unsubscribe = onAuthCleared(listener);

    expect(() => clearAuth()).not.toThrow();

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});

describe('isSessionExpired', () => {
  it('is expired when no token is stored', () => {
    expect(isSessionExpired()).toBe(true);
  });

  it('is expired when the token exp is in the past', () => {
    setAuth(jwtExpiring(Date.now() - 60_000), 'B001');
    expect(isSessionExpired()).toBe(true);
  });

  it('is not expired when the token exp is still in the future', () => {
    setAuth(jwtExpiring(Date.now() + 60 * 60_000), 'B001');
    expect(isSessionExpired()).toBe(false);
  });

  it('leaves the verdict to the backend when the token carries no readable exp', () => {
    setAuth('not.a.jwt', 'B001');
    expect(isSessionExpired()).toBe(false);
  });
});
