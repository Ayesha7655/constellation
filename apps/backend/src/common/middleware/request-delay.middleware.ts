import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestDelayMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  async use(_req: Request, _res: Response, next: NextFunction): Promise<void> {
    const raw = this.configService.get<string>('REQUEST_DELAY_MS', '0');
    const delayMs = Number.parseInt(raw, 10);
    if (Number.isFinite(delayMs) && delayMs > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
    next();
  }
}
