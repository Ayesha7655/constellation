import { isLocalizedString, type AppLocale } from './types';

function firstStringValue(record: Record<string, unknown>): string {
  for (const value of Object.values(record)) {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return '';
}

/** Fallback: locale → en → first string value → ''. */
export function resolveLocalized(value: unknown, locale: AppLocale): string {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (!isLocalizedString(value)) {
    return '';
  }

  const localized = value[locale];
  if (typeof localized === 'string' && localized.length > 0) {
    return localized;
  }

  if (typeof value.en === 'string' && value.en.length > 0) {
    return value.en;
  }

  return firstStringValue(value);
}
