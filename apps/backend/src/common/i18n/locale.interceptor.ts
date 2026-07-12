import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { LocaleAwareRequest } from '../types/request.types';
import { parseRequestLocale } from './locale';

@Injectable()
export class LocaleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<LocaleAwareRequest>();
    request.locale = parseRequestLocale({
      'x-locale': request.headers['x-locale'],
      'accept-language': request.headers['accept-language'],
    });
    return next.handle();
  }
}
