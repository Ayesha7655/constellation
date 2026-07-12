import { LOCALE_COOKIE_NAME, type AppLocale } from '@/i18n/config';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Persist locale preference; pair with `router.refresh()` so server components re-render. */
export function setLocaleCookie(locale: AppLocale): void {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale};path=/;max-age=${ONE_YEAR_SECONDS};SameSite=Lax`;
}
