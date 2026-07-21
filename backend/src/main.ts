import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

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
      whitelist: true, // scarta i campi non definiti nei DTO
      forbidNonWhitelisted: true, // e blocca del tutto la richiesta che li contiene
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Rabbit Cook API')
    .setDescription('Game session persistence and child authentication.')
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
