import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

export const API_LOCALE_HEADER = {
  name: 'x-locale',
  required: false,
  description: 'UI locale (en | ar). Falls back to Accept-Language, then en.',
} as const;

/** JWT-protected controller with optional locale header documentation. */
export function ApiLocaleBearerController(tag: string) {
  return applyDecorators(ApiTags(tag), ApiBearerAuth('access-token'), ApiHeader(API_LOCALE_HEADER));
}

/** Public controller that resolves localized catalog copy via `x-locale`. */
export function ApiPublicLocaleController(tag: string) {
  return applyDecorators(ApiTags(tag), ApiHeader(API_LOCALE_HEADER));
}
