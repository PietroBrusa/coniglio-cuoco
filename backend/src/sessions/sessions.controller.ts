import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { DeleteResultDto, SessionDto } from './dto/session.dto';
import { AuthGuard, AuthedRequest } from '../auth/auth.guard';

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(AuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @ApiCreatedResponse({ type: SessionDto })
  create(@Body() dto: CreateSessionDto, @Req() req: AuthedRequest) {
    return this.sessionsService.create({ ...dto, childId: req.user!.name });
  }

  @Get()
  @ApiOkResponse({ type: SessionDto, isArray: true })
  findAll(@Req() req: AuthedRequest) {
    return this.sessionsService.findByChild(req.user!.name);
  }

  @Get(':id')
  @ApiOkResponse({ type: SessionDto })
  findOne(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.sessionsService.findOneForChild(id, req.user!.name);
  }

  @Delete(':id')
  @ApiOkResponse({ type: DeleteResultDto })
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.sessionsService.removeForChild(id, req.user!.name);
  }
}
