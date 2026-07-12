import { authCodeToMessageKey } from '@constellation/shared';
import type { TranslateFn } from '@/i18n/translate-user-message';

const BACKEND_MESSAGE_CODE_PATTERN = /^(api|auth)\.[a-z0-9_.]+$/;

/** True when `value` is a stable backend code (`api.*` / `auth.*`), not user-facing prose. */
export function isBackendMessageCode(value: string): boolean {
  return BACKEND_MESSAGE_CODE_PATTERN.test(value.trim());
}

/** Resolve a backend API/auth code to localized copy (`errors.api.*` / `errors.auth.*`). */
export function translateAuthCode(code: string, t: TranslateFn, fallbackKey = 'errors.generic'): string {
  const trimmed = code.trim();
  const messageKey = authCodeToMessageKey(trimmed);
  const translated = t(messageKey);
  if (translated === messageKey || translated === trimmed) {
    return t(fallbackKey);
  }
  return translated;
}
