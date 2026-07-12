import type { ConfigService } from '@nestjs/config';

const DEFAULT_WEB_URL = 'http://localhost:4000';

export function getWebUrl(configService: ConfigService): string {
  const raw = configService.get<string>('WEB_URL', DEFAULT_WEB_URL).trim();
  return raw.replace(/\/$/, '') || DEFAULT_WEB_URL;
}
