/**
 * Stato di autenticazione: chi sta giocando e come si entra o si esce.
 *
 * @module
 */

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

/** Ciò che il contesto di autenticazione mette a disposizione delle schermate. */
interface AuthContextType {
  /** Nome del bambino autenticato, `null` se non c'è nessuna sessione attiva. */
  childId: string | null;
  /** Scorciatoia per `childId !== null`, letta dalla rotta protetta. */
  isLoggedIn: boolean;
  /** Autentica un bambino già registrato. */
  login: (name: string, password: string) => Promise<void>;
  /** Registra un nuovo bambino e lo autentica. */
  register: (name: string, password: string) => Promise<void>;
  /** Chiude la sessione e cancella il token dal dispositivo. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Rende disponibile lo stato di autenticazione a tutta l'applicazione.
 *
 * All'avvio la scadenza del token viene controllata in locale, decodificandone
 * il contenuto, senza interpellare il server: se è scaduto la sessione viene
 * chiusa subito. Un 401 ricevuto da una qualsiasi chiamata provoca la stessa
 * pulizia attraverso {@link storage/tokenStore.onAuthCleared}, così il codice di
 * rete non ha bisogno di conoscere React.
 *
 * Le chiamate passano da {@link api/client}, come quelle delle sessioni: il
 * contesto non conosce né Axios né i codici HTTP, e i messaggi d'errore del
 * server vengono tradotti in un punto solo per tutta l'applicazione.
 */
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

  const value = useMemo(
    () => ({ childId, isLoggedIn: childId !== null, login, register, logout }),
    [childId, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Accede allo stato di autenticazione.
 *
 * @returns Il contesto di autenticazione.
 * @throws Error se usato fuori da `<AuthProvider>`.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>');
  return ctx;
}
