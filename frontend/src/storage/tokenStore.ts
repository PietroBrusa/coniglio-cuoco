/**
 * Conservazione del token di accesso sul dispositivo.
 *
 * Il token sta in `localStorage`: sopravvive alla chiusura del browser, il che
 * evita al terapista di riautenticarsi a ogni sessione di lavoro. In cambio è
 * leggibile da JavaScript, quindi un attacco XSS potrebbe sottrarlo; un cookie
 * `HttpOnly` sarebbe più robusto, al prezzo di dover gestire il CSRF.
 *
 * @module
 */

const TOKEN_KEY = 'cc_token';
const CHILD_KEY = 'cc_child';

const clearedListeners = new Set<() => void>();

/**
 * Token di accesso corrente.
 *
 * @returns Il token, `null` se non c'è nessuna sessione attiva.
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Bambino a cui appartiene la sessione attiva.
 *
 * @returns Il nome memorizzato, `null` se non c'è nessuna sessione attiva.
 */
export function getStoredChild(): string | null {
  return localStorage.getItem(CHILD_KEY);
}

/**
 * Apre una sessione di accesso sul dispositivo.
 *
 * @param token - Token restituito dal backend.
 * @param child - Nome del bambino autenticato.
 */
export function setAuth(token: string, child: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(CHILD_KEY, child);
}

/**
 * Chiude la sessione di accesso e avvisa chi si era registrato.
 *
 * Viene chiamata sia dal pulsante di uscita sia dallo strato di rete quando una
 * richiesta riceve 401: in entrambi i casi l'interfaccia torna alla schermata di
 * accesso.
 */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CHILD_KEY);
  clearedListeners.forEach((listener) => listener());
}

/**
 * Registra una funzione da eseguire quando la sessione viene chiusa.
 *
 * È il ponte fra lo strato di rete e React: permette al contesto di
 * autenticazione di reagire a un 401 senza che il codice delle chiamate debba
 * conoscere i componenti.
 *
 * @param listener - Funzione da eseguire alla chiusura della sessione.
 * @returns La funzione che annulla la registrazione, da usare quando il
 * componente viene smontato.
 */
export function onAuthCleared(listener: () => void): () => void {
  clearedListeners.add(listener);
  return () => {
    clearedListeners.delete(listener);
  };
}

/**
 * Legge la scadenza dal contenuto del token, senza verificarne la firma:
 * serve solo a evitare una chiamata che il server rifiuterebbe comunque.
 */
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

/**
 * Verifica in locale se la sessione di accesso è scaduta.
 *
 * @returns `true` se il token manca o è scaduto. Un token illeggibile viene
 * considerato valido: sarà il server a rifiutarlo, che è l'unico giudice della
 * sua firma.
 */
export function isSessionExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  const expiry = expiryOf(token);
  return expiry !== null && expiry <= Date.now();
}
