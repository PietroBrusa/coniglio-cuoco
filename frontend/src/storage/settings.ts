export interface AppSettings {
  promptLatencyMs: number;
  holdEngagementPct: number;
  soundEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  promptLatencyMs: 3000,
  holdEngagementPct: 40,
  soundEnabled: true,
};

const STORAGE_KEY = 'coniglio-cuoco:settings';

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    return;
  }
}
