import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { CodedHttpException } from './coded-http.exception';

@Catch(CodedHttpException)
export class CodedExceptionFilter implements ExceptionFilter {
  catch(exception: CodedHttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    response.status(exception.getStatus()).json(exception.getResponse());
  }
}
