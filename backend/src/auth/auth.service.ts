import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ChildrenService } from '../children/children.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

export interface AuthResult {
  access_token: string;
  name: string;
}

const MONGO_DUPLICATE_KEY_CODE = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: number }).code === MONGO_DUPLICATE_KEY_CODE
  );
}

@Injectable()
export class AuthService {
  constructor(
    private readonly childrenService: ChildrenService,
    private readonly jwtService: JwtService,
  ) {}

  async register({ name, password }: AuthCredentialsDto): Promise<AuthResult> {
    const existing = await this.childrenService.findByName(name);
    if (existing) throw new ConflictException('Child already registered');

    const passwordHash = await bcrypt.hash(password, 10);
    try {
      await this.childrenService.create(name, passwordHash);
    } catch (error) {
      //la verifica sopra non basta da sola contro due registrazioni con lo stesso nome
      //in corsa fra loro: l'indice unico sul nome è l'ultima parola
      if (isDuplicateKeyError(error)) throw new ConflictException('Child already registered');
      throw error;
    }
    return this.sign(name);
  }

  async login({ name, password }: AuthCredentialsDto): Promise<AuthResult> {
    const child = await this.childrenService.findByName(name);
    const ok = child ? await this.matchesPassword(password, child.passwordHash) : false;
    if (!ok) throw new UnauthorizedException('Invalid name or password');
    return this.sign(name);
  }

  private async matchesPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      //un hash mancante o corrotto non è una password giusta
      return false;
    }
  }

  private async sign(name: string): Promise<AuthResult> {
    const access_token = await this.jwtService.signAsync({ sub: name, name });
    return { access_token, name };
  }
}
