import { LOCALE_COOKIE_NAME, resolveAppLocale, type AppLocale } from '@/i18n/config';

function readLocaleCookie(): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

/** Read active UI locale for backend API calls (client-side). */
export function getClientApiLocale(): AppLocale {
  return resolveAppLocale(readLocaleCookie());
}

/** Read locale from cookie in Server Components / Route Handlers. */
export async function getServerApiLocale(): Promise<AppLocale> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return resolveAppLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
}

/** Header sent to backend — must match apps/backend/src/common/i18n/locale.ts. */
export function getApiLocaleHeaders(): Record<string, string> {
  return { 'x-locale': getClientApiLocale() };
}
