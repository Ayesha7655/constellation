import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from './types';

function parseAcceptLanguage(header: string | undefined): AppLocale | undefined {
  if (!header) {
    return undefined;
  }

  for (const part of header.split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase();
    if (!tag) {
      continue;
    }
    const primary = tag.split('-')[0] ?? tag;
    if (isAppLocale(primary)) {
      return primary;
    }
    if (isAppLocale(tag)) {
      return tag;
    }
  }

  return undefined;
}

/** Resolve request locale: x-locale → Accept-Language → en. */
export function parseRequestLocale(headers: {
  'x-locale'?: string | string[];
  'accept-language'?: string | string[];
}): AppLocale {
  const rawHeader = headers['x-locale'];
  const rawLocale = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  const normalized = rawLocale?.trim().toLowerCase();
  if (normalized && isAppLocale(normalized)) {
    return normalized;
  }

  const acceptHeader = headers['accept-language'];
  const acceptLanguage = Array.isArray(acceptHeader) ? acceptHeader[0] : acceptHeader;
  return parseAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
}
