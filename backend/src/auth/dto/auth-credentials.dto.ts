/**
 * Credenziali in ingresso per registrazione e accesso.
 *
 * @module
 */

import { IsString, MaxLength, MinLength } from 'class-validator';

/** Corpo della richiesta di registrazione o di accesso. */
export class AuthCredentialsDto {
  /**
   * Identificativo del bambino, pensato come codice pseudonimo (es. `B001`):
   * nel database non finisce nessun dato anagrafico.
   */
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;

  /**
   * Password del bambino.
   *
   * Il minimo di quattro caratteri è una scelta di usabilità clinica — la
   * credenziale è condivisa nel contesto terapeutico e va digitata in fretta —
   * non uno standard di sicurezza generale.
   */
  @IsString()
  @MinLength(4)
  @MaxLength(100)
  password!: string;
}
