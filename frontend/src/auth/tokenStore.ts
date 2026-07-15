/**
 * JWT token and child name persistence in `localStorage`.
 * Non-React module used by both {@link AuthProvider} and the API client
 * (which reads the token to attach it as a `Bearer` header on every request).
 */

const TOKEN_KEY = 'cc_token';
const CHILD_KEY = 'cc_child';

/** Subscribers notified whenever the stored auth is cleared. */
const clearedListeners = new Set<() => void>();

/**
 * Returns the stored JWT token, or `null` if the user is not authenticated.
 * @returns Bearer token string, or `null`.
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Returns the child name from the last authenticated session, or `null`.
 * @returns Child identifier string, or `null`.
 */
export function getStoredChild(): string | null {
  return localStorage.getItem(CHILD_KEY);
}

/**
 * Persists token and child name after a successful login or registration.
 * @param token - JWT access token received from the backend.
 * @param child - Child identifier received from the backend.
 */
export function setAuth(token: string, child: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(CHILD_KEY, child);
}

/**
 * Clears the stored token and child name (logout or expired session) and
 * notifies every subscriber, so that React state cannot drift out of sync with
 * storage — an expired token is cleared here from a plain module (the API error
 * handler), which has no way of calling `setChildId` itself.
 */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CHILD_KEY);
  clearedListeners.forEach((listener) => listener());
}

/**
 * Subscribes to {@link clearAuth}.
 * @param listener - Called every time the stored auth is cleared.
 * @returns An unsubscribe function.
 */
export function onAuthCleared(listener: () => void): () => void {
  clearedListeners.add(listener);
  return () => {
    clearedListeners.delete(listener);
  };
}

/**
 * Reads the expiry (`exp` claim) of a JWT without verifying its signature —
 * verification is the backend's job; here we only need to know whether it is
 * worth sending at all.
 * @param token - The raw JWT.
 * @returns Expiry as a Unix timestamp in ms, or `null` if absent or unreadable.
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
 * @returns `true` if there is no usable token.
 */
export function isSessionExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  const expiry = expiryOf(token);
  return expiry !== null && expiry <= Date.now();
}
