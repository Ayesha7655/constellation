import { HttpException, HttpStatus } from '@nestjs/common';

/** HTTP exception whose JSON body is `{ statusCode, code }` or `{ statusCode, code, details }`. */
export class CodedHttpException extends HttpException {
  constructor(
    public readonly code: string,
    status: HttpStatus,
    public readonly details?: Record<string, unknown>,
  ) {
    const body: Record<string, unknown> = { statusCode: status, code };
    if (details !== undefined) {
      body.details = details;
    }
    super(body, status);
  }
}

export function codedBadRequest(code: string, details?: Record<string, unknown>): never {
  throw new CodedHttpException(code, HttpStatus.BAD_REQUEST, details);
}

export function codedTooManyRequests(code: string): never {
  throw new CodedHttpException(code, HttpStatus.TOO_MANY_REQUESTS);
}

export function codedConflict(code: string): never {
  throw new CodedHttpException(code, HttpStatus.CONFLICT);
}

export function codedNotFound(code: string): never {
  throw new CodedHttpException(code, HttpStatus.NOT_FOUND);
}

export function codedForbidden(code: string): never {
  throw new CodedHttpException(code, HttpStatus.FORBIDDEN);
}
