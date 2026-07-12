'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import type { AppLocale } from '@/i18n/config';
import { LOCALE_CHANGE_EVENT, type LocaleChangeDetail } from '@/i18n/locale-change';

type LocaleRefetchContext = Readonly<{
  isCancelled: () => boolean;
}>;

/**
 * Refetch locale-sensitive API data on mount, when next-intl locale updates after refresh,
 * and immediately when LocaleSwitcher changes language (cookie already updated).
 */
export function useLocaleRefetch(
  onLocale: (locale: AppLocale, ctx: LocaleRefetchContext) => void | Promise<void>,
): AppLocale {
  const locale = useLocale() as AppLocale;

  useEffect(() => {
    let cancelled = false;
    const ctx: LocaleRefetchContext = { isCancelled: () => cancelled };

    const run = (targetLocale: AppLocale) => {
      void Promise.resolve(onLocale(targetLocale, ctx));
    };

    run(locale);

    const onLocaleChange = (event: Event) => {
      run((event as CustomEvent<LocaleChangeDetail>).detail.locale);
    };

    window.addEventListener(LOCALE_CHANGE_EVENT, onLocaleChange as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener(LOCALE_CHANGE_EVENT, onLocaleChange as EventListener);
    };
  }, [locale, onLocale]);

  return locale;
}
