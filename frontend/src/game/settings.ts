/**
 * Operator-configurable application settings, persisted in the browser
 * (localStorage). These control the star-rating thresholds — so a therapist can
 * tune how generously stars are awarded without touching the code — plus a
 * global victory-sound toggle.
 */
export interface AppSettings {
  /** Max latency to the first tap (ms) to earn the "prompt approach" star. */
  promptLatencyMs: number;
  /** Engagement ratio (%) required for the "sustained contact" star (hold levels). */
  holdEngagementPct: number;
  /** Total contact time (ms) required for the "sustained contact" star (tap levels). */
  tapContactMs: number;
  /** Whether the victory sound plays at the end of a level. */
  soundEnabled: boolean;
}

/** Factory defaults (match the original hard-coded thresholds). */
export const DEFAULT_SETTINGS: AppSettings = {
  promptLatencyMs: 3000,
  holdEngagementPct: 40,
  tapContactMs: 1500,
  soundEnabled: true,
};

const STORAGE_KEY = 'coniglio-cuoco:settings';

/**
 * Loads settings from localStorage, merged over {@link DEFAULT_SETTINGS} so that
 * missing or corrupt values always fall back to a sane default.
 * @returns The current settings.
 */
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

/**
 * Persists settings to localStorage.
 * @param settings - The settings to save.
 */
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable (private mode / quota) — ignore, keep in-memory */
  }
}
