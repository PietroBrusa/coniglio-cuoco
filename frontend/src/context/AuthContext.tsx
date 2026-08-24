import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as api from '@/api/client';
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

export function AuthProvider({ children }: { children: ReactNode }) {

  //gira una volta sola
  const [childId, setChildId] = useState<string | null>(() => {
    //controllo scadenza token, controllo una volta perchè è inutile controllarlo a ogni render
    if (isSessionExpired()) {
      clearAuth();
      return null;
    }
    return getStoredChild();
  });

  //se avviene clearAuth (autenticazione azzerata), setta il childId a null
  useEffect(() => onAuthCleared(() => setChildId(null)), []);

  const authenticate = useCallback(
    async (kind: 'login' | 'register', name: string, password: string) => {
      const { token, childId } = await (kind === 'login'
        ? api.login(name, password)
        : api.register(name, password));
      setAuth(token, childId);
      setChildId(childId);
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

  //quando childId/login/register/logout cambia, ricalcola value
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
