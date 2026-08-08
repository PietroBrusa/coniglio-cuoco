/**
 * Registrazione, accesso e firma dei token.
 *
 * @module
 */

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ChildrenService } from '../children/children.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

/** Esito di un'autenticazione riuscita. */
export interface AuthResult {
  /** Token JWT firmato, con scadenza fissata da `JWT_EXPIRES`. */
  access_token: string;
  /** Nome del bambino autenticato. */
  name: string;
}

/**
 * Logica di autenticazione.
 *
 * Le password sono protette con bcrypt a costo 10: abbastanza lento da rendere
 * impraticabile un attacco a dizionario sul database sottratto, abbastanza
 * veloce da non farsi notare durante l'accesso.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly childrenService: ChildrenService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registra un nuovo bambino e lo autentica subito.
   *
   * @param credentials - Nome e password scelti.
   * @returns Token di accesso e nome registrato.
   * @throws ConflictException se il nome è già in uso. Qui, a differenza
   * dell'accesso, l'errore è esplicito: l'utente deve poterne scegliere un altro.
   */
  async register({ name, password }: AuthCredentialsDto): Promise<AuthResult> {
    const existing = await this.childrenService.findByName(name);
    if (existing) throw new ConflictException('Child already registered');
    const passwordHash = await bcrypt.hash(password, 10);
    await this.childrenService.create(name, passwordHash);
    return this.sign(name);
  }

  /**
   * Autentica un bambino già registrato.
   *
   * @param credentials - Nome e password.
   * @returns Token di accesso e nome del bambino.
   * @throws UnauthorizedException con un messaggio unico per nome inesistente e
   * password errata: non rivela quali account esistono.
   */
  async login({ name, password }: AuthCredentialsDto): Promise<AuthResult> {
    const child = await this.childrenService.findByName(name);
    const ok = child && (await bcrypt.compare(password, child.passwordHash));
    if (!ok) throw new UnauthorizedException('Invalid name or password');
    return this.sign(name);
  }

  /** Firma il token con il nome del bambino come soggetto. */
  private async sign(name: string): Promise<AuthResult> {
    const access_token = await this.jwtService.signAsync({ sub: name, name });
    return { access_token, name };
  }
}
