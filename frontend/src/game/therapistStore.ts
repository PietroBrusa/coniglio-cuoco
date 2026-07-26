const STORAGE_KEY = 'coniglio-cuoco:therapist';

/** The therapist rarely changes between sessions, so the setup form pre-fills the last one. */
export function loadTherapist(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveTherapist(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    return;
  }
}
