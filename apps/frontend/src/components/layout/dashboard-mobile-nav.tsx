'use client';

import { useCallback, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { DashboardNavConfig } from '@/lib/dashboard-nav';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { TEST_IDS } from '@constellation/shared';

type DashboardMobileNavProps = Readonly<{
  config: DashboardNavConfig;
}>;

export function DashboardMobileNav({ config }: DashboardMobileNavProps) {
  const t = useTranslations('dashboard');
  const [open, setOpen] = useState(false);

  const onOpenClick = useCallback(() => {
    setOpen(true);
  }, []);

  const onCloseClick = useCallback(() => {
    setOpen(false);
  }, []);

  const onNavigate = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <button
        type="button"
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        onClick={onOpenClick}
        data-testid={TEST_IDS.dashboardNav.mobileOpen}
        aria-expanded={open}
        aria-controls="dashboard-mobile-nav"
        aria-label={t('openNav')}
      >
        <Menu className="size-5" aria-hidden />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-background/80"
            onClick={onCloseClick}
            data-testid={`${TEST_IDS.dashboardNav.mobileClose}-backdrop`}
            aria-label={t('closeNav')}
          />
          <aside
            id="dashboard-mobile-nav"
            className="relative flex h-full w-64 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md"
          >
            <div className="flex items-center justify-end border-b border-sidebar-border p-2">
              <button
                type="button"
                className="rounded-md p-2 text-sidebar-foreground/70 transition-colors hover:bg-white/10 hover:text-sidebar-foreground"
                onClick={onCloseClick}
                data-testid={TEST_IDS.dashboardNav.mobileClose}
                aria-label={t('closeNav')}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <DashboardSidebar config={config} onNavigate={onNavigate} />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
