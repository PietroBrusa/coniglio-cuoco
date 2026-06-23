import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { DeleteResultDto, SessionDto } from './dto/session.dto';
import { AuthGuard, AuthedRequest } from '../auth/auth.guard';

/**
 * REST controller for the `sessions` resource. All routes are JWT-protected
 * and scoped to the authenticated child: `childId` is always taken from the
 * token, never trusted from the request body.
 */
@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(AuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * Saves a new session for the authenticated child.
   * `POST /sessions` — 201 Created.
   */
  @Post()
  @ApiCreatedResponse({ type: SessionDto })
  create(@Body() dto: CreateSessionDto, @Req() req: AuthedRequest) {
    return this.sessionsService.create({ ...dto, childId: req.user!.name });
  }

  /**
   * Lists all sessions for the authenticated child, most recent first.
   * `GET /sessions` — 200 OK.
   */
  @Get()
  @ApiOkResponse({ type: SessionDto, isArray: true })
  findAll(@Req() req: AuthedRequest) {
    return this.sessionsService.findByChild(req.user!.name);
  }

  /**
   * Returns a single session, only if it belongs to the authenticated child.
   * `GET /sessions/:id` — 200 OK or 404 Not Found.
   */
  @Get(':id')
  @ApiOkResponse({ type: SessionDto })
  findOne(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.sessionsService.findOneForChild(id, req.user!.name);
  }

  /**
   * Deletes a session, only if it belongs to the authenticated child.
   * `DELETE /sessions/:id` — 200 OK or 404 Not Found.
   */
  @Delete(':id')
  @ApiOkResponse({ type: DeleteResultDto })
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.sessionsService.removeForChild(id, req.user!.name);
  }
}
