import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './settings';

function createLocalStorageFake(): Storage {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: () => {
      store = {};
    },
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createLocalStorageFake());
});

describe('loadSettings', () => {
  it('returns the defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('merges stored values over the defaults (missing keys keep defaults)', () => {
    localStorage.setItem(
      'coniglio-cuoco:settings',
      JSON.stringify({ promptLatencyMs: 1000 }),
    );
    const settings = loadSettings();
    expect(settings.promptLatencyMs).toBe(1000);
    expect(settings.holdEngagementPct).toBe(DEFAULT_SETTINGS.holdEngagementPct);
  });

  it('falls back to defaults on corrupt JSON', () => {
    localStorage.setItem('coniglio-cuoco:settings', '{not valid json');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('saveSettings', () => {
  it('round-trips through storage (save then load)', () => {
    const custom = { ...DEFAULT_SETTINGS, tapContactMs: 2500, soundEnabled: false };
    saveSettings(custom);
    expect(loadSettings()).toEqual(custom);
  });
});
