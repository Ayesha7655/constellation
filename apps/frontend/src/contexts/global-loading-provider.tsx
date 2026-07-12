'use client';

import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { AppLoading } from '@constellation/shared/ui';
import { getGlobalLoadingActive, subscribeGlobalLoading } from '@/lib/global-loading';

type GlobalLoadingProviderProps = Readonly<{
  children: ReactNode;
}>;

export function GlobalLoadingProvider({ children }: GlobalLoadingProviderProps) {
  const t = useTranslations('common');
  const isLoading = useSyncExternalStore(subscribeGlobalLoading, getGlobalLoadingActive, () => false);

  return (
    <>
      {children}
      {isLoading ? <AppLoading label={t('waiting')} /> : null}
    </>
  );
}
