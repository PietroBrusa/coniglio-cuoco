import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

/** Authentication routes: registration and login, both returning a JWT token. */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new child account and returns a signed token.
   * `POST /auth/register` — 201 Created.
   */
  @Post('register')
  @ApiCreatedResponse({ type: AuthResponseDto })
  register(@Body() dto: AuthCredentialsDto) {
    return this.authService.register(dto);
  }

  /**
   * Authenticates an existing child and returns a signed token.
   * `POST /auth/login` — 200 OK.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() dto: AuthCredentialsDto) {
    return this.authService.login(dto);
  }
}
