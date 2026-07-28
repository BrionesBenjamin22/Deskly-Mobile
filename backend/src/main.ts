import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';

import { AppModule } from './app.module';
import { HttpExceptionLoggingFilter } from './common/filters/http-exception-logging.filter';
import {
  resolveCorrelationId,
  sanitizeHttpPath,
} from './common/http/request-observability';

type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

function getAllowedOrigins() {
  const configuredOrigins = process.env.FRONTEND_URL?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [
    ...(configuredOrigins ?? []),
    'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:19006',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8082',
    'http://127.0.0.1:19006',
  ];
}

function isLocalDevelopmentOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
}

function isPrivateNetworkDevelopmentOrigin(origin: string) {
  return /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
    origin,
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const logger = new Logger('HTTP');

  app.enableCors({
    origin(origin: string | undefined, callback: CorsOriginCallback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowedOrigins = getAllowedOrigins();

      if (
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' &&
          (isLocalDevelopmentOrigin(origin) ||
            isPrivateNetworkDevelopmentOrigin(origin)))
      ) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  });

  app.use((request: Request, response: Response, next: NextFunction) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    const startedAt = Date.now();
    const correlationId = resolveCorrelationId(
      request.header('x-correlation-id'),
    );
    response.setHeader('x-correlation-id', correlationId);
    const requestLabel = `${request.method} ${sanitizeHttpPath(request.originalUrl)} correlation=${correlationId}`;

    logger.log(`--> ${requestLabel}`);

    response.on('finish', () => {
      const duration = Date.now() - startedAt;
      const status = response.statusCode;
      const message = `<-- ${requestLabel} ${status} ${duration}ms`;

      if (status >= 500) {
        logger.error(message);
      } else if (status >= 400) {
        logger.warn(message);
      } else {
        logger.log(message);
      }
    });

    next();
  });

  app.useGlobalFilters(new HttpExceptionLoggingFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidUnknownValues: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Deskly API')
      .setDescription('API para la gestion de espacios de coworking.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT ?? 3000;

  await app.listen(port, '0.0.0.0');

  console.log(`Server running on http://localhost:${port}`);
  console.log(`Expo Go can connect using http://<YOUR_LAN_IP>:${port}`);
}

void bootstrap();
