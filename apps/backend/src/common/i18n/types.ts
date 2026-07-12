/** Keep in sync with apps/frontend/src/i18n/config.ts */
export const LOCALES = ['en', 'ar'] as const;

export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';

export type LocalizedString = Readonly<{
  en: string;
  ar?: string;
}>;

export function isAppLocale(value: string): value is AppLocale {
  return (LOCALES as readonly string[]).includes(value);
}

export function isLocalizedString(value: unknown): value is LocalizedString {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.en === 'string';
}
