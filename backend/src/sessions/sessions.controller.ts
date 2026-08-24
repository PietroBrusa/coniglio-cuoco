import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { DeleteResultDto, SessionDto, toSessionDto } from './dto/session.dto';
import { AuthGuard, AuthedRequest } from '../auth/auth.guard';

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(AuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @ApiCreatedResponse({ type: SessionDto })
  async create(@Body() dto: CreateSessionDto, @Req() req: AuthedRequest): Promise<SessionDto> {
    const saved = await this.sessionsService.create({ ...dto, childId: req.user.name });
    return toSessionDto(saved);
  }

  @Get()
  @ApiOkResponse({ type: SessionDto, isArray: true })
  async findAll(@Req() req: AuthedRequest): Promise<SessionDto[]> {
    const sessions = await this.sessionsService.findByChild(req.user.name);
    return sessions.map(toSessionDto);
  }

  @Get(':id')
  @ApiOkResponse({ type: SessionDto })
  async findOne(@Param('id') id: string, @Req() req: AuthedRequest): Promise<SessionDto> {
    const session = await this.sessionsService.findOneForChild(id, req.user.name);
    return toSessionDto(session);
  }

  @Delete(':id')
  @ApiOkResponse({ type: DeleteResultDto })
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.sessionsService.removeForChild(id, req.user.name);
  }
}
