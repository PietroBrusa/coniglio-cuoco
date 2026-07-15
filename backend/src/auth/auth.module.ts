import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ChildrenModule } from '../children/children.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

/**
 * Authentication module: configures the JWT service (secret and expiry from
 * environment variables) and exports {@link AuthGuard} for use by other
 * protected modules.
 */
@Module({
  imports: [
    ChildrenModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Nessun valore di ripiego: un segreto di default farebbe partire
        // l'applicazione con token falsificabili da chiunque legga il sorgente.
        // Meglio un avvio che fallisce di un sistema che sembra sicuro e non lo è.
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
