import type { AppLocale } from '@/i18n/config';

export const LOCALE_CHANGE_EVENT = 'constellation:locale-change';

export type LocaleChangeDetail = Readonly<{ locale: AppLocale }>;

/** Fired by LocaleSwitcher after the cookie is set, before router.refresh(). */
export function dispatchLocaleChange(locale: AppLocale): void {
  window.dispatchEvent(new CustomEvent<LocaleChangeDetail>(LOCALE_CHANGE_EVENT, { detail: { locale } }));
}
