import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import type { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // The production host (Railway) puts one proxy in front of the API.
  // Trust it so req.ip is the client address. Without this, every
  // request shares the proxy IP, and the auth throttle (10 per minute)
  // applies to all users together.
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new AllExceptionsFilter());
  // PAT-001: every write endpoint validates its body with a class-validator
  // DTO; unknown fields are stripped instead of silently accepted.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api/v1');

  const configService = app.get(ConfigService<AppConfig>);
  const port = configService.get('port', { infer: true }) ?? 3000;
  const nodeEnv = configService.get('nodeEnv', { infer: true });
  const corsOrigins = configService.get('corsOrigins', { infer: true }) ?? [];

  // Native mobile clients send no Origin header and are unaffected by CORS.
  // A configured CORS_ORIGINS always wins; otherwise fall back to the Expo
  // web dev server's known local ports outside production so the web
  // preview can call the API without extra setup, and stay closed by
  // default in production until a real website origin is configured.
  if (corsOrigins.length > 0) {
    app.enableCors({ origin: corsOrigins, credentials: true });
  } else if (nodeEnv !== 'production') {
    app.enableCors({
      origin: [
        'http://localhost:8081',
        'http://localhost:19006',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
      ],
      credentials: true,
    });
  }

  await app.listen(port);
}

bootstrap();
