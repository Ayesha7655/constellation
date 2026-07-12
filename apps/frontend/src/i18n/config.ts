export const locales = ['en', 'ar'] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'en';

export function isAppLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale);
}

/** Cookie → NEXT_PUBLIC_DEFAULT_LOCALE → en. Keep in sync with i18n/request.ts and lib/api-locale.ts. */
export function resolveAppLocale(cookieValue: string | undefined): AppLocale {
  if (cookieValue && isAppLocale(cookieValue)) {
    return cookieValue;
  }
  const envDefault = process.env.NEXT_PUBLIC_DEFAULT_LOCALE;
  if (envDefault && isAppLocale(envDefault)) {
    return envDefault;
  }
  return defaultLocale;
}

export function localeDirection(locale: string): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** Cookie name for the active UI locale (no locale segment in URLs). */
export const LOCALE_COOKIE_NAME = 'locale';
