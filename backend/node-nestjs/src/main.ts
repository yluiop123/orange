import 'reflect-metadata';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { traceIdMiddleware } from './common/trace-id.middleware';
import { AppConfig } from './config/app-config';

const SWAGGER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Orange API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      persistAuthorization: true,
      docExpansion: 'none'
    });
  </script>
</body>
</html>
`;

// Walks up at most five ancestors from the working directory for the shared contract.
function loadContract(): string | null {
  let dir = process.cwd();
  for (let level = 0; level <= 5; level += 1) {
    const candidate = join(dir, 'contracts', 'openapi.json');
    if (existsSync(candidate)) {
      return readFileSync(candidate, 'utf8');
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return null;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(AppConfig);

  app.setGlobalPrefix('api/v1');

  // Documentation endpoints sit outside the controllers, so no global guard wraps them.
  const contract = loadContract();
  const express = app.getHttpAdapter().getInstance();
  express.get('/openapi.json', (_req: unknown, res: any) => {
    if (contract === null) {
      res.status(500).type('text/plain').send('contracts/openapi.json was not found at startup');
      return;
    }
    res.type('application/json').send(contract);
  });
  express.get('/swagger', (_req: unknown, res: any) => {
    res.type('text/html').send(SWAGGER_HTML);
  });
  if (contract === null) {
    Logger.warn(
      'contracts/openapi.json was not found within 5 parent directories; GET /openapi.json will return 500',
      'Bootstrap',
    );
  }

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
