/**
 * OpenAPI bootstrap — see `.cursor/rules/constellation.mdc` (OpenAPI / Swagger) for required
 * decorators on every new/changed endpoint.
 *
 * @see https://docs.nestjs.com/openapi/introduction
 */
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { CodedErrorResponseDto } from './coded-error-response.dto';

const DEVICE_ID_HEADER = 'x-device-id';

function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Constellation API')
    .setDescription('Constellation backend REST API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token from POST /api/auth/firebase or /api/auth/refresh',
      },
      'access-token',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: DEVICE_ID_HEADER,
        description: 'Stable device identifier (required for Firebase login)',
      },
      'device-id',
    )
    .build();
}

export function createSwaggerDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(app, buildSwaggerConfig(), { extraModels: [CodedErrorResponseDto] });
}

export function setupSwagger(app: INestApplication): void {
  const document = createSwaggerDocument(app);

  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

export { DEVICE_ID_HEADER };
