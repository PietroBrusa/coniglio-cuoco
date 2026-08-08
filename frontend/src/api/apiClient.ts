/**
 * Istanze del client HTTP generato dallo spec OpenAPI.
 *
 * @module
 */

import { AuthApi, Configuration, SessionsApi } from './generated';
import { getToken } from '@/storage/tokenStore';

/**
 * Configurazione condivisa dalle due API.
 *
 * L'indirizzo del backend arriva da `VITE_API_URL`, che Vite sostituisce **al
 * momento della build**: cambiarlo richiede ricostruire il bundle, non basta
 * riavviare il contenitore. Il token è una funzione e non un valore, così ogni
 * richiesta legge quello corrente senza dover ricreare il client dopo un accesso.
 */
const config = new Configuration({
  basePath: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  accessToken: () => getToken() ?? '',
});

/** Chiamate di registrazione e accesso. */
export const authApi = new AuthApi(config);

/** Chiamate di lettura, scrittura e cancellazione delle sessioni. */
export const sessionsApi = new SessionsApi(config);
