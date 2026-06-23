import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AxiosError } from 'axios';
import { authApi } from '../api/apiClient';
import { clearAuth, getStoredChild, setAuth } from '../auth/tokenStore';

/**
 * App-wide authentication state. Exposes the logged-in child, the `isLoggedIn`
 * flag and the login / register / logout actions. Credential verification is
 * handled entirely by the backend; only the JWT token (stored in `localStorage`)
 * and its derived UI state are kept here.
 */
interface AuthContextType {
  /** Identifier of the currently logged-in child, or `null` when logged out. */
  childId: string | null;
  /** `true` when a valid token is present in storage. */
  isLoggedIn: boolean;
  /**
   * Authenticates with an existing account.
   * @param name - Child identifier.
   * @param password - Plain-text password (transmitted over HTTPS only).
   * @throws {Error} Human-readable message from the backend on failure.
   */
  login: (name: string, password: string) => Promise<void>;
  /**
   * Creates a new account and logs in immediately.
   * @param name - Desired child identifier.
   * @param password - Plain-text password.
   * @throws {Error} Human-readable message from the backend on failure.
   */
  register: (name: string, password: string) => Promise<void>;
  /** Clears the stored token and resets `childId` to `null`. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Extracts a user-readable message from a backend Axios error response.
 * @param e - Any caught value.
 * @returns A descriptive error string.
 */
function messageFrom(e: unknown): string {
  if (e instanceof AxiosError) {
    const msg = (e.response?.data as { message?: string | string[] })?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (msg) return msg;
  }
  return e instanceof Error ? e.message : 'Errore di accesso';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [childId, setChildId] = useState<string | null>(() => getStoredChild());

  const authenticate = useCallback(
    async (kind: 'login' | 'register', name: string, password: string) => {
      try {
        const call =
          kind === 'login'
            ? authApi.authControllerLogin({ name, password })
            : authApi.authControllerRegister({ name, password });
        const { data } = await call;
        setAuth(data.access_token, data.name);
        setChildId(data.name);
      } catch (e) {
        throw new Error(messageFrom(e), { cause: e });
      }
    },
    [],
  );

  const login = useCallback(
    (n: string, p: string) => authenticate('login', n, p),
    [authenticate]
  );

  const register = useCallback(
    (n: string, p: string) => authenticate('register', n, p),
    [authenticate],
  );

  const logout = useCallback(() => {
    clearAuth();
    setChildId(null);
  }, []);

  const value = useMemo(
    () => ({ childId, isLoggedIn: childId !== null, login, register, logout }),
    [childId, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access the authentication context.
 * @returns The current {@link AuthContextType} value.
 * @throws {Error} If used outside an `<AuthProvider>` tree.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>');
  return ctx;
}
