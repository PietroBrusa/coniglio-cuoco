import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsModule } from './sessions/sessions.module';
import { SessionEntity } from './sessions/entities/session.entity';
import { ChildEntity } from './children/entities/child.entity';
import { AuthModule } from './auth/auth.module';


/**
 * Modulo radice: configurazione, connessione al database e moduli applicativi.
 *
 * Il modello a documenti di MongoDB conserva una sessione così com'è — livelli,
 * misurazioni e array dei contatti annidati in un unico documento — che è il
 * modo in cui l'applicazione la legge e la scrive sempre; in un database
 * relazionale servirebbero quattro tabelle e altrettante join per ricostruire un
 * oggetto che nessuno usa a pezzi.
 *
 * `synchronize` crea gli indici dichiarati dalle entità, come quello univoco sul
 * nome del bambino: su MongoDB non comporta migrazioni di schema.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mongodb',
        url: config.get<string>('MONGODB_URI', 'mongodb://localhost:27017'),
        database: config.get<string>('MONGODB_DB', 'coniglio_cuoco'),
        entities: [SessionEntity, ChildEntity],
        synchronize: true,
      }),
    }),
    AuthModule,
    SessionsModule,
  ],
})
export class AppModule {}
