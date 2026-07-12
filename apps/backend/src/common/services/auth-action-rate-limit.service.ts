import { Injectable } from '@nestjs/common';
import { AUTH_ERROR_CODES } from '@constellation/shared';
import { ConfigService } from '@nestjs/config';
import { codedTooManyRequests } from '../exceptions/coded-http.exception';

type RateLimitBucket = Readonly<{
  count: number;
  windowStartedAt: number;
}>;

@Injectable()
export class AuthActionRateLimitService {
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(private readonly configService: ConfigService) {}

  assertWithinLimit(
    scope: string,
    identifier: string,
    options?: Readonly<{
      maxRequests?: number;
      windowMs?: number;
      code?: string;
    }>,
  ): void {
    const maxRequests = options?.maxRequests ?? this.configService.get<number>('AUTH_ACTION_RATE_LIMIT_MAX', 10);
    const windowMs = options?.windowMs ?? this.configService.get<number>('AUTH_ACTION_RATE_LIMIT_WINDOW_MS', 60_000);
    const key = `${scope}:${identifier}`;
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || now - existing.windowStartedAt >= windowMs) {
      this.buckets.set(key, { count: 1, windowStartedAt: now });
      return;
    }

    if (existing.count >= maxRequests) {
      codedTooManyRequests(options?.code ?? AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS);
    }

    this.buckets.set(key, {
      count: existing.count + 1,
      windowStartedAt: existing.windowStartedAt,
    });
  }
}
