/**
 * JWT token and child name persistence in `localStorage`.
 * Non-React module used by both {@link AuthProvider} and the API client
 * (which reads the token to attach it as a `Bearer` header on every request).
 */

const TOKEN_KEY = 'cc_token';
const CHILD_KEY = 'cc_child';

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

/** Clears the stored token and child name (logout or expired session). */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CHILD_KEY);
}
