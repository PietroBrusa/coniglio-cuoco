const TOKEN_KEY = 'cc_token';
const CHILD_KEY = 'cc_child';

const clearedListeners = new Set<() => void>();

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredChild(): string | null {
  return localStorage.getItem(CHILD_KEY);
}

export function setAuth(token: string, child: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(CHILD_KEY, child);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CHILD_KEY);
  clearedListeners.forEach((listener) => listener());
}

export function onAuthCleared(listener: () => void): () => void {
  clearedListeners.add(listener);
  return () => {
    clearedListeners.delete(listener);
  };
}

function expiryOf(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isSessionExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  const expiry = expiryOf(token);
  return expiry !== null && expiry <= Date.now();
}
