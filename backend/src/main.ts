import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';

import { AppModule } from './app.module';
import { HttpExceptionLoggingFilter } from './common/filters/http-exception-logging.filter';

function getAllowedOrigins() {
  const configuredOrigins = process.env.FRONTEND_URL?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) {
    return configuredOrigins;
  }

  return [
    'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:8082',
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('HTTP');

  app.enableCors({
    origin: getAllowedOrigins(),
    credentials: true,
  });

  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();
    const requestLabel = `${request.method} ${request.originalUrl}`;

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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Deskly API')
    .setDescription('API para la gestion de espacios de coworking.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;

  await app.listen(port, '0.0.0.0');

  console.log(`Server running on http://localhost:${port}`);
  console.log(`Expo Go can connect using http://<YOUR_LAN_IP>:${port}`);
}

void bootstrap();
