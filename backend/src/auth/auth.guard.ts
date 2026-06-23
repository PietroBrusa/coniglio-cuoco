import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/** Identity payload embedded in the JWT. */
export interface AuthUser {
  sub: string;
  name: string;
}

/** Express request augmented with the authenticated user after guard execution. */
export interface AuthedRequest extends Request {
  user?: AuthUser;
}

/**
 * Route guard: extracts and verifies the Bearer token, populates
 * `request.user` with the decoded payload, and throws 401 if the token is
 * missing or invalid.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Grants access only if a valid JWT Bearer token is present.
   * @throws {UnauthorizedException} When the token is absent or fails verification.
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

  /**
   * Extracts the token from the `Authorization: Bearer <token>` header.
   * @returns The raw token string, or `undefined` if the header is absent or malformed.
   */
  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
