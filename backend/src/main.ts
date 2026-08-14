import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Avvia il server HTTP.
 *
 * Tre configurazioni valgono la pena di essere notate:
 *
 * - **CORS**: in sviluppo accetta qualunque porta locale, in produzione solo le
 *   origini elencate in `CORS_ORIGIN`;
 * - **validazione globale**: `whitelist` elimina i campi non dichiarati nei DTO
 *   e `forbidNonWhitelisted` fa rispondere 400 invece di ignorarli in silenzio,
 *   mentre `transform` istanzia le classi così che le regole valgano anche per
 *   gli oggetti annidati;
 * - **Swagger** su `/api`: da lì si esporta lo spec OpenAPI con cui viene
 *   generato il client TypeScript del frontend.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const corsOrigin = config.get<string>('CORS_ORIGIN');
  app.enableCors({
    origin: corsOrigin
      ? corsOrigin.split(',').map((o) => o.trim())
      : /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Coniglio Cuoco')
    .setDescription('Persistenza delle sessioni di gioco e autenticazione dei bambini.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`🐰 Rabbit Cook API listening on http://localhost:${port}`);
  console.log(`📖 Swagger UI at http://localhost:${port}/api`);
}

void bootstrap();
