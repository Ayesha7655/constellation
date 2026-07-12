'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@constellation/shared/ui';

type DashboardGuardErrorProps = Readonly<{
  onRetry: () => void;
}>;

export function DashboardGuardError({ onRetry }: DashboardGuardErrorProps) {
  const t = useTranslations('dashboard');

  const onRetryClick = useCallback(() => {
    onRetry();
  }, [onRetry]);

  return (
    <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-4 bg-background p-6">
      <p className="text-sm text-muted-foreground">{t('sessionCheckFailed')}</p>
      <Button type="button" variant="outline" fullWidth={false} onClick={onRetryClick}>
        {t('retry')}
      </Button>
    </div>
  );
}
