/**
 * Endpoint pubblici di registrazione e accesso.
 *
 * @module
 */

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

/** Le due sole rotte raggiungibili senza token. */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registra un nuovo bambino e lo autentica.
   *
   * @param dto - Nome e password.
   * @returns Token di accesso e nome registrato.
   * @throws ConflictException (409) se il nome è già registrato.
   */
  @Post('register')
  @ApiCreatedResponse({ type: AuthResponseDto })
  register(@Body() dto: AuthCredentialsDto) {
    return this.authService.register(dto);
  }

  /**
   * Autentica un bambino già registrato.
   *
   * Risponde 200 e non 201: non viene creato niente, si ottiene solo un token.
   *
   * @param dto - Nome e password.
   * @returns Token di accesso e nome del bambino.
   * @throws UnauthorizedException (401) se le credenziali non sono valide.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() dto: AuthCredentialsDto) {
    return this.authService.login(dto);
  }
}
