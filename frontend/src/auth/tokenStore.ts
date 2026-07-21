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

/**
 * Clears the stored auth and notifies every subscriber, so that React state
 * cannot drift out of sync with storage — an expired token is cleared here from
 * a plain module (the API error handler), which has no way of calling
 * `setChildId` itself.
 */
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

/**
 * Reads the `exp` claim without verifying the signature — verification is the
 * backend's job; here we only need to know whether the token is worth sending.
 */
function expiryOf(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null; // malformed token: let the backend be the judge
  }
}

/**
 * Whether the stored token is missing or has already expired. Lets the app log
 * out on startup instead of discovering the expiry only when a request fails —
 * which, in the game flow, would happen right when the session is being saved.
 */
export function isSessionExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  const expiry = expiryOf(token);
  return expiry !== null && expiry <= Date.now();
}
