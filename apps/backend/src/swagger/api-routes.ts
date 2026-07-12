import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { INSUFFICIENT_PERMISSIONS_MESSAGE } from '../common/permissions/permissions.constants';
import {
  API_VALIDATION_ERROR_DESCRIPTION,
  ApiBadRequest,
  ApiCodedBadRequest,
  ApiCodedError,
  ApiConflict,
  ApiForbidden,
  ApiForbiddenAccountErrors,
  ApiJwtAuthErrors,
  ApiNotFound,
  ApiNotFoundUser,
  ApiPermissionForbidden,
  ApiValidationErrors,
  isCodedErrorConfig,
  type CodedErrorConfig,
} from './api-responses';
import { DEVICE_ID_HEADER } from './setup-swagger';

export type ApiRouteOkConfig = { type: Type<unknown> } | { schema: { example: Record<string, unknown> } };

/** A route error slot: a legacy description string, or a coded `{ codes }` config. */
export type ErrorSlot = string | CodedErrorConfig;

const notFoundResponse = (slot: ErrorSlot) => (isCodedErrorConfig(slot) ? ApiCodedError(404, slot) : ApiNotFound(slot));
const conflictResponse = (slot: ErrorSlot) => (isCodedErrorConfig(slot) ? ApiCodedError(409, slot) : ApiConflict(slot));
const badRequestResponse = (slot: ErrorSlot, validation: boolean) =>
  isCodedErrorConfig(slot) ? ApiCodedBadRequest(slot, { withValidation: validation }) : ApiBadRequest(slot);
const forbiddenResponse = (slot: ErrorSlot) =>
  isCodedErrorConfig(slot) ? ApiCodedError(403, slot) : ApiForbidden(slot);

type ApiProtectedAdminRouteOptions = {
  summary: string;
  ok: ApiRouteOkConfig;
  validation?: boolean;
  notFound?: ErrorSlot;
  badRequest?: ErrorSlot;
  conflict?: ErrorSlot;
};

type ApiJwtProtectedRouteOptions = {
  summary: string;
  ok: ApiRouteOkConfig;
  validation?: boolean;
  notFoundUser?: boolean;
  notFound?: ErrorSlot;
  badRequest?: ErrorSlot;
  /** Domain `403` for row-level access or active-role enforcement (not the permission matrix). */
  forbidden?: ErrorSlot;
};

type ApiJwtPermissionProtectedRouteOptions = {
  summary: string;
  ok: ApiRouteOkConfig;
  /** Document the success body as `201 Created` (POST create routes) instead of `200`. */
  created?: boolean;
  validation?: boolean;
  notFound?: ErrorSlot;
  notFoundUser?: boolean;
  badRequest?: ErrorSlot;
  conflict?: ErrorSlot;
  /**
   * Row-level access `403` description, for routes that ALSO enforce ownership beyond the
   * permission matrix. OpenAPI allows one `403` per operation, so this merges into the same
   * response as the permission-matrix denial (`INSUFFICIENT_PERMISSIONS_MESSAGE`).
   */
  forbidden?: string;
};

type ApiPublicRouteOptions = {
  summary: string;
  ok: ApiRouteOkConfig;
  notFound?: ErrorSlot;
  badRequest?: ErrorSlot;
  unauthorized?: string;
};

type ApiPublicWriteRouteOptions = {
  summary: string;
  ok: ApiRouteOkConfig;
  badRequest?: ErrorSlot;
  conflict?: ErrorSlot;
  notFound?: ErrorSlot;
};

type ApiFirebaseLoginRouteOptions = {
  summary: string;
  ok: ApiRouteOkConfig;
  badRequest?: ErrorSlot;
};

type ApiDeviceBoundPublicRouteOptions = {
  summary: string;
  ok: ApiRouteOkConfig;
  badRequest?: ErrorSlot;
  conflict?: ErrorSlot;
  notFound?: ErrorSlot;
  tooManyRequests?: CodedErrorConfig;
};

function apiOkResponse(ok: ApiRouteOkConfig) {
  if ('type' in ok) {
    return ApiOkResponse({ type: ok.type });
  }
  return ApiOkResponse({ schema: ok.schema });
}

/** `201 Created` variant of {@link apiOkResponse} for create endpoints. */
function apiCreatedResponse(ok: ApiRouteOkConfig) {
  if ('type' in ok) {
    return ApiCreatedResponse({ type: ok.type });
  }
  return ApiCreatedResponse({ schema: ok.schema });
}

/** OpenAPI allows one `400` response per operation — merge validation + domain copy when both apply. */
function apiProtectedAdminBadRequest(options: Pick<ApiProtectedAdminRouteOptions, 'validation' | 'badRequest'>) {
  const { validation, badRequest } = options;
  if (isCodedErrorConfig(badRequest)) {
    return ApiCodedBadRequest(badRequest, { withValidation: !!validation });
  }
  if (validation && badRequest) {
    return ApiBadRequestResponse({
      description: `${API_VALIDATION_ERROR_DESCRIPTION}; or ${badRequest}`,
    });
  }
  if (validation) {
    return ApiBadRequestResponse({ description: API_VALIDATION_ERROR_DESCRIPTION });
  }
  if (badRequest) {
    return ApiBadRequestResponse({ description: badRequest });
  }
  return undefined;
}

/** `@RequirePermissions` admin route — JWT auth, permission forbidden, operation, and success body. */
export function ApiProtectedAdminRoute(options: ApiProtectedAdminRouteOptions) {
  const decorators = [
    ApiOperation({ summary: options.summary }),
    ApiJwtAuthErrors(),
    ApiPermissionForbidden(),
    apiOkResponse(options.ok),
  ];

  const badRequest = apiProtectedAdminBadRequest(options);
  if (badRequest) {
    decorators.push(badRequest);
  }
  if (options.notFound) {
    decorators.push(notFoundResponse(options.notFound));
  }
  if (options.conflict) {
    decorators.push(conflictResponse(options.conflict));
  }

  return applyDecorators(...decorators);
}

/** JWT-protected route without a permission matrix (e.g. `GET /users/me`). */
export function ApiJwtProtectedRoute(options: ApiJwtProtectedRouteOptions) {
  const decorators = [ApiOperation({ summary: options.summary }), ApiJwtAuthErrors(), apiOkResponse(options.ok)];

  if (options.badRequest) {
    decorators.push(badRequestResponse(options.badRequest, !!options.validation));
  } else if (options.validation) {
    decorators.push(ApiValidationErrors());
  }
  if (options.notFound) {
    decorators.push(notFoundResponse(options.notFound));
  }
  if (options.notFoundUser) {
    decorators.push(ApiNotFoundUser());
  }
  if (options.forbidden) {
    decorators.push(forbiddenResponse(options.forbidden));
  }

  return applyDecorators(...decorators);
}

/** JWT-protected route with primary-role permission checks (`@RequirePermissions` / `@RequireAnyPermissions`). */
export function ApiJwtPermissionProtectedRoute(options: ApiJwtPermissionProtectedRouteOptions) {
  const decorators = [
    ApiOperation({ summary: options.summary }),
    ApiJwtAuthErrors(),
    // Merge the row-level access `403` into the single permission-matrix `403` when both apply.
    options.forbidden
      ? ApiForbidden(`${INSUFFICIENT_PERMISSIONS_MESSAGE}; or ${options.forbidden}`)
      : ApiPermissionForbidden(),
    options.created ? apiCreatedResponse(options.ok) : apiOkResponse(options.ok),
  ];

  const badRequest = apiProtectedAdminBadRequest({ validation: options.validation, badRequest: options.badRequest });
  if (badRequest) {
    decorators.push(badRequest);
  }
  if (options.notFound) {
    decorators.push(notFoundResponse(options.notFound));
  }
  if (options.notFoundUser) {
    decorators.push(ApiNotFoundUser());
  }
  if (options.conflict) {
    decorators.push(conflictResponse(options.conflict));
  }

  return applyDecorators(...decorators);
}

/** Public read route. */
export function ApiPublicRoute(options: ApiPublicRouteOptions) {
  const decorators = [ApiOperation({ summary: options.summary }), apiOkResponse(options.ok)];

  if (options.notFound) {
    decorators.push(notFoundResponse(options.notFound));
  }
  if (options.badRequest) {
    decorators.push(badRequestResponse(options.badRequest, false));
  }
  if (options.unauthorized) {
    decorators.push(ApiUnauthorizedResponse({ description: options.unauthorized }));
  }

  return applyDecorators(...decorators);
}

/** Public route with a validated request body or query DTO. */
export function ApiPublicWriteRoute(options: ApiPublicWriteRouteOptions) {
  const decorators = [ApiOperation({ summary: options.summary }), apiOkResponse(options.ok)];

  // Public write routes always validate a body — the 400 is validation, optionally unioned with coded domain errors.
  decorators.push(options.badRequest ? badRequestResponse(options.badRequest, true) : ApiValidationErrors());
  if (options.conflict) {
    decorators.push(conflictResponse(options.conflict));
  }
  if (options.notFound) {
    decorators.push(notFoundResponse(options.notFound));
  }

  return applyDecorators(...decorators);
}

/** `POST /auth/firebase` — device header, validation, and account-status forbidden responses. */
export function ApiFirebaseLoginRoute(options: ApiFirebaseLoginRouteOptions) {
  return applyDecorators(
    ApiOperation({ summary: options.summary }),
    ApiHeader({
      name: DEVICE_ID_HEADER,
      required: true,
      description: 'Stable device identifier',
    }),
    ApiSecurity('device-id'),
    options.badRequest ? badRequestResponse(options.badRequest, true) : ApiValidationErrors(),
    ApiForbiddenAccountErrors(),
    apiOkResponse(options.ok),
  );
}

/** Public onboarding action bound to `x-device-id` (e.g. submit application). */
export function ApiDeviceBoundPublicRoute(options: ApiDeviceBoundPublicRouteOptions) {
  const decorators = [ApiOperation({ summary: options.summary }), ApiSecurity('device-id'), apiOkResponse(options.ok)];

  if (options.badRequest) {
    decorators.push(badRequestResponse(options.badRequest, true));
  }
  if (options.conflict) {
    decorators.push(conflictResponse(options.conflict));
  }
  if (options.notFound) {
    decorators.push(notFoundResponse(options.notFound));
  }
  if (options.tooManyRequests) {
    decorators.push(ApiCodedError(429, options.tooManyRequests));
  }

  return applyDecorators(...decorators);
}
