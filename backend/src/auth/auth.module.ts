import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ChildrenModule } from '../children/children.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

/**
 * Modulo di autenticazione.
 *
 * Il segreto di firma è obbligatorio: senza `JWT_SECRET` la fabbrica lancia un
 * errore e l'applicazione non parte. È voluto — impedisce il caso peggiore,
 * cioè andare in produzione con un segreto predefinito e noto.
 *
 * Esporta la guardia e il modulo JWT perché il modulo delle sessioni possa
 * proteggere le proprie rotte senza duplicare la configurazione.
 */
@Module({
  imports: [
    ChildrenModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error(
            'JWT_SECRET non è impostata. Definiscila nel file .env (sviluppo) o fra le ' +
              "variabili d'ambiente del servizio (produzione).",
          );
        }
        return {
          secret,
          signOptions: {
            expiresIn: config.get<string>('JWT_EXPIRES', '12h') as `${number}h`,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthGuard, JwtModule],
})
export class AuthModule {}
