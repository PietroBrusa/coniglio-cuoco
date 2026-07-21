/**
 * Star-rating thresholds, so a therapist can tune how generously stars are
 * awarded without touching the code.
 */
export interface AppSettings {
  /** Max latency to the first tap (ms) to earn the "prompt approach" star. */
  promptLatencyMs: number;
  /** Engagement ratio (%) for the "sustained contact" star (hold levels). */
  holdEngagementPct: number;
  /** Total contact time (ms) for the "sustained contact" star (tap levels). */
  tapContactMs: number;
  soundEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  promptLatencyMs: 3000,
  holdEngagementPct: 40,
  tapContactMs: 1500,
  soundEnabled: true,
};

const STORAGE_KEY = 'coniglio-cuoco:settings';

/** Merged over the defaults, so missing or corrupt values still fall back. */
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
    /* storage unavailable (private mode / quota) — ignore, keep in-memory */
  }
}
