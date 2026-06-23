import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ChildrenService } from '../children/children.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

/** Authentication result: signed JWT token and child name. */
export interface AuthResult {
  access_token: string;
  name: string;
}

/** Authentication logic: registration, login and token signing. */
@Injectable()
export class AuthService {
  constructor(
    private readonly childrenService: ChildrenService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers a new child account, hashes the password and returns a token.
   * @throws {ConflictException} (409) if a child with the same name already exists.
   */
  async register({ name, password }: AuthCredentialsDto): Promise<AuthResult> {
    const existing = await this.childrenService.findByName(name);
    if (existing) throw new ConflictException('Child already registered');
    const passwordHash = await bcrypt.hash(password, 10);
    await this.childrenService.create(name, passwordHash);
    return this.sign(name);
  }

  /**
   * Verifies credentials via bcrypt and returns a token on success.
   * @throws {UnauthorizedException} (401) if the name or password is wrong.
   */
  async login({ name, password }: AuthCredentialsDto): Promise<AuthResult> {
    const child = await this.childrenService.findByName(name);
    const ok = child && (await bcrypt.compare(password, child.passwordHash));
    if (!ok) throw new UnauthorizedException('Invalid name or password');
    return this.sign(name);
  }

  /**
   * Signs a JWT with the child's name as both `sub` and `name` claims.
   * @param name - Child identifier to embed in the token payload.
   * @returns Signed {@link AuthResult} with the access token and name.
   */
  private async sign(name: string): Promise<AuthResult> {
    const access_token = await this.jwtService.signAsync({ sub: name, name });
    return { access_token, name };
  }
}
