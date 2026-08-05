import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AxiosError } from 'axios';
import { authApi } from '@/api/apiClient';
import {
  clearAuth,
  getStoredChild,
  isSessionExpired,
  onAuthCleared,
  setAuth,
} from '@/storage/tokenStore';

interface AuthContextType {
  childId: string | null;
  isLoggedIn: boolean;
  login: (name: string, password: string) => Promise<void>;
  register: (name: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function messageFrom(e: unknown): string {
  if (e instanceof AxiosError) {
    const msg = (e.response?.data as { message?: string | string[] })?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (msg) return msg;
  }
  return e instanceof Error ? e.message : 'Errore di accesso';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [childId, setChildId] = useState<string | null>(() => {
    if (isSessionExpired()) {
      clearAuth();
      return null;
    }
    return getStoredChild();
  });

  useEffect(() => onAuthCleared(() => setChildId(null)), []);

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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>');
  return ctx;
}
