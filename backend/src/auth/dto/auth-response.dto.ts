/**
 * Risposta di registrazione e accesso.
 *
 * @module
 */

/**
 * Esito dell'autenticazione.
 *
 * Serve anche a Swagger per descrivere la risposta nello spec OpenAPI, da cui
 * viene generato il client del frontend.
 */
export class AuthResponseDto {
  /** Token JWT da inviare nell'intestazione `Authorization` delle richieste successive. */
  access_token!: string;

  /** Nome del bambino autenticato. */
  name!: string;
}
