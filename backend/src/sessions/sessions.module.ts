import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionEntity } from './entities/session.entity';
import { AuthModule } from '../auth/auth.module';

/**
 * Modulo delle sessioni di gioco.
 *
 * Importa il modulo di autenticazione per la sola guardia: può proteggere le
 * proprie rotte, non può toccare la logica delle password.
 */
@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity]), AuthModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
