'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AppLocale } from '@/i18n/config';
import { RolesTable } from '@/components/admin/roles-table';
import { useLocaleRefetch } from '@/hooks/use-locale-refetch';
import { Button } from '@constellation/shared/ui';
import { listAdminRoles } from '@/services/admin-api';
import type { RoleSummary } from '@/types/admin';

type LoadState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error' }>
  | Readonly<{ status: 'ready'; roles: readonly RoleSummary[] }>;

async function fetchRolesForLocale(
  locale: AppLocale,
  isCancelled: () => boolean,
): Promise<LoadState | null> {
  try {
    const response = await listAdminRoles(locale);
    if (isCancelled()) {
      return null;
    }
    return { status: 'ready', roles: response.roles };
  } catch {
    if (isCancelled()) {
      return null;
    }
    return { status: 'error' };
  }
}

export function RolesAndPermissionsView() {
  const t = useTranslations('dashboard.admin.accessControl');
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  const loadForLocale = useCallback(async (targetLocale: AppLocale, { isCancelled }: { isCancelled: () => boolean }) => {
    setLoadState({ status: 'loading' });
    const nextState = await fetchRolesForLocale(targetLocale, isCancelled);
    if (nextState) {
      setLoadState(nextState);
    }
  }, []);

  const locale = useLocaleRefetch(loadForLocale);

  const onRetryClick = useCallback(() => {
    void loadForLocale(locale, { isCancelled: () => false });
  }, [loadForLocale, locale]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{t('title')}</h2>
        <p className="text-muted-foreground">{t('description')}</p>
        <p className="text-sm text-muted-foreground">{t('catalogScope')}</p>
      </div>

      {loadState.status === 'error' ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-destructive">{t('loadError')}</p>
          <Button variant="outline" fullWidth={false} onClick={onRetryClick}>
            {t('retry')}
          </Button>
        </div>
      ) : null}

      {loadState.status === 'ready' ? <RolesTable roles={loadState.roles} /> : null}
    </div>
  );
}
