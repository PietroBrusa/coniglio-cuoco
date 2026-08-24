const TOKEN_KEY = 'cc_token';
const CHILD_KEY = 'cc_child';

//set di funzioni
const clearedListeners = new Set<() => void>();

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredChild(): string | null {
  try {
    return localStorage.getItem(CHILD_KEY);
  } catch {
    return null;
  }
}

export function setAuth(token: string, child: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(CHILD_KEY, child);
  } catch {
    return;
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CHILD_KEY);
  } catch {
    //storage non disponibile: non c'è nulla da rimuovere, si prosegue comunque
  }
  //chiama le funzioni iscritte (authcontext che mette il childid a null)
  clearedListeners.forEach((listener) => listener());
}

//iscrive il listener e restituisce le funzioni per disiscriverlo, la usa useEffect come cleanup
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
