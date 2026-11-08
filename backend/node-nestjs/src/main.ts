import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { traceIdMiddleware } from './common/trace-id.middleware';
import { AppConfig } from './config/app-config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(AppConfig);

  app.setGlobalPrefix('api/v1');

  // The document is generated from the controllers and DTOs that Nest already
  // knows about. Both endpoints sit outside the global prefix and the guards.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ORANGE API (Node / NestJS)')
    .setDescription('Generated from the NestJS controllers and DTOs')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: { url: '/openapi.json', persistAuthorization: true },
  });
  const express = app.getHttpAdapter().getInstance();
  express.get('/openapi.json', (_req: unknown, res: any) => {
    res.type('application/json').send(document);
  });

  // Trace first so CORS preflight responses also carry the header.
  app.use(traceIdMiddleware);
  app.use(cookieParser());

  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Locale', 'X-Trace-Id', 'X-Request-Id'],
    exposedHeaders: ['X-Trace-Id'],
    maxAge: 3600,
  });

  app.enableShutdownHooks();
  await app.listen(config.port);

  Logger.log(`ORANGE Node/NestJS listening on http://localhost:${config.port}/api/v1`, 'Bootstrap');
}

void bootstrap();
