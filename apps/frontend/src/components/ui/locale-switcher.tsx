'use client';

import { useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { locales, type AppLocale } from '@/i18n/config';
import { setLocaleCookie } from '@/i18n/set-locale';
import { dispatchLocaleChange } from '@/i18n/locale-change';
import { Dropdown } from '@constellation/shared/ui';
import { TEST_IDS } from '@constellation/shared';

/** Hidden by default — set `NEXT_PUBLIC_LOCALE_SWITCHER_ENABLED=true` to show. See `.cursor/rules/constellation.mdc` (i18n). */
const isLocaleSwitcherVisible = process.env.NEXT_PUBLIC_LOCALE_SWITCHER_ENABLED === 'true';

export function LocaleSwitcher() {
  const t = useTranslations('locale');
  const locale = useLocale() as AppLocale;
  const router = useRouter();

  const options = useMemo(
    () => locales.map((entry) => ({ value: entry, label: t(entry) })),
    [t],
  );

  const handleChange = useCallback(
    (nextLocale: AppLocale) => {
      if (nextLocale === locale) {
        return;
      }
      setLocaleCookie(nextLocale);
      dispatchLocaleChange(nextLocale);
      router.refresh();
    },
    [locale, router],
  );

  if (!isLocaleSwitcherVisible) {
    return null;
  }

  return (
    <Dropdown
      value={locale}
      options={options}
      onChange={handleChange}
      ariaLabel={t('switchLabel')}
      testId={TEST_IDS.nav.localeSwitcher}
    />
  );
}
