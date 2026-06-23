import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsModule } from './sessions/sessions.module';
import { SessionEntity } from './sessions/entities/session.entity';
import { ChildEntity } from './children/entities/child.entity';
import { AuthModule } from './auth/auth.module';


/**
 * Root module: loads configuration from environment variables, establishes the
 * MongoDB connection (via TypeORM), and composes the Auth and Sessions feature
 * modules.
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
