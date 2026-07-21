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
    await this.childrenService.create(name, passwordHash);
    return this.sign(name);
  }

  async login({ name, password }: AuthCredentialsDto): Promise<AuthResult> {
    const child = await this.childrenService.findByName(name);
    const ok = child && (await bcrypt.compare(password, child.passwordHash));
    if (!ok) throw new UnauthorizedException('Invalid name or password');
    return this.sign(name);
  }

  /** The child's name is both the `sub` and the `name` claim. */
  private async sign(name: string): Promise<AuthResult> {
    const access_token = await this.jwtService.signAsync({ sub: name, name });
    return { access_token, name };
  }
}
