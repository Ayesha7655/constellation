'use client';

import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';

/** Hidden by default — set `NEXT_PUBLIC_LOCALE_SWITCHER_ENABLED=true` to show. */
const isLocaleSwitcherVisible = process.env.NEXT_PUBLIC_LOCALE_SWITCHER_ENABLED === 'true';

export function ProfilePreferencesSection() {
  const t = useTranslations('dashboard.profile.preferences');

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {isLocaleSwitcherVisible ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-foreground">{t('language')}</span>
          <LocaleSwitcher />
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-medium text-foreground">{t('theme')}</span>
          <p className="text-sm text-muted-foreground">{t('themeDescription')}</p>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}
