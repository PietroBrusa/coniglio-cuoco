/**
 * Guardia che protegge le rotte delle sessioni.
 *
 * @module
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/** Contenuto del token verificato. */
export interface AuthUser {
  /** Soggetto del token: il nome del bambino. */
  sub: string;
  /** Nome del bambino, usato dai controller per filtrare i dati. */
  name: string;
}

/**
 * Richiesta a cui la guardia ha già allegato l'utente autenticato.
 *
 * Il campo non è opzionale perché le rotte che dichiarano questo tipo stanno
 * tutte dietro {@link AuthGuard}: se si arriva al controller, la guardia è
 * passata. Renderlo opzionale costringerebbe ogni controller a un `!` che
 * nasconde la garanzia invece di esprimerla.
 */
export interface AuthedRequest extends Request {
  /** Bambino autenticato, letto dal token. */
  user: AuthUser;
}

/**
 * Verifica il token e allega alla richiesta il bambino autenticato.
 *
 * È il punto in cui l'identità entra nel sistema: i controller non leggono mai
 * il bambino dal corpo della richiesta, ma solo da qui, così un client non può
 * dichiararsi qualcun altro.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * @param context - Contesto della richiesta in arrivo.
   * @returns `true` se il token è valido.
   * @throws UnauthorizedException se il token manca, è scaduto o la firma non torna.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Missing token');
    try {
      request.user = await this.jwtService.verifyAsync<AuthUser>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }

  /** Estrae il token dall'intestazione `Authorization: Bearer <token>`. */
  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
