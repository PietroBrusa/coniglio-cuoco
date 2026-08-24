const STORAGE_KEY = 'coniglio-cuoco:therapist';

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
