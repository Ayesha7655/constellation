import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json, raw, urlencoded } from 'express';
import { AppModule } from './app.module';
import { CodedExceptionFilter } from './common/exceptions/coded-exception.filter';
import { resolveLogLevels } from './common/logging/resolve-log-levels';
import { getWebUrl } from './common/utils/web-url';
import { setupSwagger } from './swagger/setup-swagger';

/** Base64 JSON uploads need a higher limit than Express default (100kb). */
function resolveJsonBodyLimit(configService: ConfigService): string {
  const explicitMb = configService.get<string>('REQUEST_JSON_BODY_LIMIT_MB');
  if (explicitMb?.trim()) {
    return `${explicitMb.trim()}mb`;
  }
  const uploadMaxMb = Number(configService.get<string>('UPLOAD_MAX_FILE_SIZE_MB') ?? '40');
  const computedMb = Math.ceil(uploadMaxMb * 1.4) + 2;
  return `${computedMb}mb`;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    logger: resolveLogLevels(process.env.LOG_LEVEL),
  });
  const configService = app.get(ConfigService);
  const bodyLimit = resolveJsonBodyLimit(configService);

  app.use('/api/payments/webhooks', raw({ type: 'application/json' }));
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: getWebUrl(configService),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id', 'x-locale', 'x-onboarding-upload-key'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new CodedExceptionFilter());

  if (configService.get<string>('NODE_ENV', 'development') !== 'production') {
    setupSwagger(app);
  }

  const port = configService.get<number>('PORT', 4050);
  await app.listen(port);
}

void bootstrap();
