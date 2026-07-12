'use client';

import { useTranslations } from 'next-intl';
import { SidePanel } from '@constellation/shared/ui';
import { ManageSessionsPanel } from './manage-sessions-panel';

type ManageSessionsSidePanelProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

export function ManageSessionsSidePanel({ open, onOpenChange }: ManageSessionsSidePanelProps) {
  const t = useTranslations('dashboard.profile.sessions');

  return (
    <SidePanel open={open} onOpenChange={onOpenChange} title={t('title')} description={t('description')}>
      <ManageSessionsPanel />
    </SidePanel>
  );
}
