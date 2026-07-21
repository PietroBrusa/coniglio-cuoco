import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionEntity } from './entities/session.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity]), AuthModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
