/**
 * Strato applicativo sopra il client generato.
 *
 * Espone funzioni con i nomi del dominio e centralizza la gestione degli
 * errori, così i componenti non conoscono né Axios né i codici HTTP.
 *
 * @module
 */

import { AxiosError } from 'axios';
import type { Session } from '@/types';
import { authApi, sessionsApi } from './apiClient';
import type { SessionDto } from './generated';
import { clearAuth } from '@/storage/tokenStore';

/** Una sessione come torna dal server: come {@link types.Session}, più `_id` e `createdAt`. */
export type SavedSession = SessionDto;

/** Esito di un accesso riuscito. */
export interface AuthResult {
  /** Token da conservare e allegare alle richieste successive. */
  token: string;
  /** Bambino autenticato, come lo ha normalizzato il server. */
  childId: string;
}

/**
 * Autentica un bambino già registrato.
 *
 * @param name - Nome del bambino.
 * @param password - Password scelta al momento della registrazione.
 * @returns Token e bambino autenticato.
 * @throws Error con il messaggio del server se le credenziali non tornano.
 */
export async function login(name: string, password: string): Promise<AuthResult> {
  return authenticate(() => authApi.authControllerLogin({ name, password }));
}

/**
 * Registra un bambino nuovo e lo autentica.
 *
 * @param name - Nome del bambino.
 * @param password - Password scelta.
 * @returns Token e bambino appena registrato.
 * @throws Error con il messaggio del server, per esempio se il nome è già preso.
 */
export async function register(name: string, password: string): Promise<AuthResult> {
  return authenticate(() => authApi.authControllerRegister({ name, password }));
}

/**
 * Parte comune di accesso e registrazione: cambia solo la rotta chiamata.
 *
 * Qui un 401 **non** chiude la sessione come nelle altre chiamate: significa
 * «credenziali sbagliate», non «sessione scaduta», e non c'è niente da pulire.
 */
async function authenticate(
  call: () => Promise<{ data: { access_token: string; name: string } }>,
): Promise<AuthResult> {
  try {
    const { data } = await call();
    return { token: data.access_token, childId: data.name };
  } catch (e) {
    throw new Error(messageFrom(e), { cause: e });
  }
}

/**
 * Scrive una sessione conclusa nel database.
 *
 * La sessione viene passata così com'è al client generato: le due forme
 * coincidono per costruzione, ed è bene che sia il compilatore a verificarlo. Un
 * cast qui zittirebbe proprio l'errore che si vuole vedere, cioè il giorno in
 * cui un campo del DTO cambia e il dominio non lo segue.
 *
 * @param session - Sessione completa di livelli e osservazioni.
 * @returns La sessione salvata, con l'identificativo assegnato dal server.
 * @throws Error se la richiesta fallisce; con un 401 la sessione di accesso
 * viene chiusa e il messaggio invita a rientrare.
 */
export async function saveSession(session: Session): Promise<SavedSession> {
  try {
    const { data } = await sessionsApi.sessionsControllerCreate(session);
    return data;
  } catch (e) {
    handleError(e);
  }
}

/**
 * Carica tutte le sessioni del bambino autenticato.
 *
 * Il server le filtra in base al token: non c'è modo di chiedere quelle di un
 * altro bambino.
 *
 * @returns Le sessioni, dalla più recente.
 * @throws Error se la richiesta fallisce.
 */
export async function fetchSessions(): Promise<SavedSession[]> {
  try {
    const { data } = await sessionsApi.sessionsControllerFindAll();
    return data;
  } catch (e) {
    handleError(e);
  }
}

/**
 * Cancella definitivamente una sessione.
 *
 * @param id - Identificativo assegnato dal server.
 * @throws Error se la richiesta fallisce, compreso il caso in cui la sessione
 * appartenga a un altro bambino (il server risponde 404).
 */
export async function deleteSession(id: string): Promise<void> {
  try {
    await sessionsApi.sessionsControllerRemove(id);
  } catch (e) {
    handleError(e);
  }
}

/**
 * Normalizza qualsiasi errore in un `Error` con un messaggio leggibile.
 *
 * Il 401 riceve un trattamento a parte: il token viene cancellato, il che
 * riporta l'applicazione alla schermata di accesso attraverso i listener
 * registrati sul contesto di autenticazione.
 */
function handleError(e: unknown): never {
  if (e instanceof AxiosError && e.response?.status === 401) {
    clearAuth();
    throw new Error('Sessione scaduta: effettua di nuovo l’accesso');
  }
  throw new Error(messageFrom(e), { cause: e });
}

/**
 * Estrae il messaggio scritto dal backend, che può essere una stringa
 * («Child already registered») o l'elenco degli errori di validazione.
 *
 * Senza questo, un errore di validazione arriverebbe all'operatore come
 * «Request failed with status code 400», che non dice che cosa correggere.
 */
function messageFrom(e: unknown): string {
  if (e instanceof AxiosError) {
    const message = (e.response?.data as { message?: string | string[] })?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (message) return message;
  }
  return e instanceof Error ? e.message : String(e);
}
