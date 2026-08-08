/**
 * Endpoint delle sessioni di gioco, tutti protetti da token.
 *
 * @module
 */

import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { DeleteResultDto, SessionDto } from './dto/session.dto';
import { AuthGuard, AuthedRequest } from '../auth/auth.guard';

/**
 * Lettura, scrittura e cancellazione delle sessioni.
 *
 * Ogni rotta lavora esclusivamente sui dati del bambino a cui appartiene il
 * token: il bambino non viene mai preso dalla richiesta.
 */
@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(AuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * Salva una sessione conclusa.
   *
   * Il bambino indicato nel corpo della richiesta viene **sovrascritto** con
   * quello del token: un client non può attribuire una sessione a qualcun altro.
   *
   * @param dto - Sessione completa di livelli, misurazioni e osservazioni.
   * @param req - Richiesta, da cui si legge il bambino autenticato.
   * @returns La sessione salvata, con l'identificativo assegnato.
   */
  @Post()
  @ApiCreatedResponse({ type: SessionDto })
  create(@Body() dto: CreateSessionDto, @Req() req: AuthedRequest) {
    return this.sessionsService.create({ ...dto, childId: req.user.name });
  }

  /**
   * Elenca le sessioni del bambino autenticato.
   *
   * @param req - Richiesta, da cui si legge il bambino autenticato.
   * @returns Le sue sessioni, dalla più recente.
   */
  @Get()
  @ApiOkResponse({ type: SessionDto, isArray: true })
  findAll(@Req() req: AuthedRequest) {
    return this.sessionsService.findByChild(req.user.name);
  }

  /**
   * Restituisce una singola sessione.
   *
   * @param id - Identificativo della sessione.
   * @param req - Richiesta, da cui si legge il bambino autenticato.
   * @returns La sessione richiesta.
   * @throws NotFoundException se non esiste **o** se appartiene a un altro bambino.
   */
  @Get(':id')
  @ApiOkResponse({ type: SessionDto })
  findOne(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.sessionsService.findOneForChild(id, req.user.name);
  }

  /**
   * Cancella definitivamente una sessione.
   *
   * @param id - Identificativo della sessione.
   * @param req - Richiesta, da cui si legge il bambino autenticato.
   * @returns Conferma della cancellazione.
   * @throws NotFoundException se non esiste o non appartiene al bambino autenticato.
   */
  @Delete(':id')
  @ApiOkResponse({ type: DeleteResultDto })
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.sessionsService.removeForChild(id, req.user.name);
  }
}
