import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { INSUFFICIENT_PERMISSIONS_MESSAGE } from '../common/permissions/permissions.constants';
import { CodedErrorResponseDto } from './coded-error-response.dto';

export const API_VALIDATION_ERROR_DESCRIPTION = 'Invalid request body or required headers';

/**
 * Declares that a status returns the coded `{ statusCode, code }` body, enumerating the
 * stable codes it can carry (a single status may carry several semantic codes).
 */
export type CodedErrorConfig = { codes: readonly string[]; description?: string };

export function isCodedErrorConfig(value: string | CodedErrorConfig | undefined): value is CodedErrorConfig {
  return typeof value === 'object' && value !== null && Array.isArray(value.codes);
}

/** Coded body schema for a status, with the possible code set enumerated. */
function codedSchema(codes: readonly string[]) {
  return {
    allOf: [{ $ref: getSchemaPath(CodedErrorResponseDto) }],
    properties: { code: { type: 'string', enum: [...codes] } },
  };
}

/** Nest's default class-validator 400 body shape (inlined for the validation∪coded union). */
const VALIDATION_BODY_SCHEMA = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer', example: 400 },
    message: { type: 'array', items: { type: 'string' } },
    error: { type: 'string', example: 'Bad Request' },
  },
} as const;

/** Documents a coded `{ statusCode, code }` error body for `status`, enumerating its codes. */
export function ApiCodedError(status: number, config: CodedErrorConfig) {
  return ApiResponse({
    status,
    description: config.description ?? `Coded error (${config.codes.join(' | ')})`,
    schema: codedSchema(config.codes),
  });
}

/** A 400 that may be a coded domain error OR a class-validator failure — accurate `oneOf` union. */
export function ApiCodedBadRequest(config: CodedErrorConfig, options?: { withValidation?: boolean }) {
  if (!options?.withValidation) {
    return ApiCodedError(400, config);
  }
  return ApiResponse({
    status: 400,
    description: config.description ?? `${API_VALIDATION_ERROR_DESCRIPTION}; or coded (${config.codes.join(' | ')})`,
    schema: { oneOf: [codedSchema(config.codes), VALIDATION_BODY_SCHEMA] },
  });
}

/** Standard JWT-protected route errors — compose on handlers that use `JwtAuthGuard`. */
export function ApiJwtAuthErrors() {
  return applyDecorators(ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }));
}

/** Routes that may return validation / missing header errors. */
export function ApiValidationErrors() {
  return applyDecorators(ApiBadRequestResponse({ description: API_VALIDATION_ERROR_DESCRIPTION }));
}

export function ApiForbiddenAccountErrors() {
  return applyDecorators(ApiForbiddenResponse({ description: 'Account suspended or email not verified' }));
}

export function ApiNotFoundUser() {
  return applyDecorators(ApiNotFoundResponse({ description: 'User not found' }));
}

/** `403` from `PermissionsGuard` when the primary role lacks a required grant. */
export function ApiPermissionForbidden() {
  return applyDecorators(ApiForbiddenResponse({ description: INSUFFICIENT_PERMISSIONS_MESSAGE }));
}

export function ApiNotFound(description: string) {
  return applyDecorators(ApiNotFoundResponse({ description }));
}

export function ApiConflict(description: string) {
  return applyDecorators(ApiConflictResponse({ description }));
}

/** Domain `403` for a route that enforces row-level access (distinct from permission-matrix 403). */
export function ApiForbidden(description: string) {
  return applyDecorators(ApiForbiddenResponse({ description }));
}

export function ApiBadRequest(description: string) {
  return applyDecorators(ApiBadRequestResponse({ description }));
}

export function ApiUploadUnauthorized() {
  return applyDecorators(ApiUnauthorizedResponse({ description: 'Invalid upload credentials' }));
}
