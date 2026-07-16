'use client';

import type { ReactNode } from 'react';
import type { DashboardNavConfig } from '@/lib/dashboard-nav';
import { DashboardBreadcrumbsProvider } from '@/contexts/dashboard-breadcrumbs-context';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { DashboardRouteBreadcrumbs } from '@/components/layout/dashboard-route-breadcrumbs';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';

type DashboardShellProps = Readonly<{
  config: DashboardNavConfig;
  children: ReactNode;
}>;

export function DashboardShell({ config, children }: DashboardShellProps) {
  return (
    <DashboardBreadcrumbsProvider>
      <DashboardRouteBreadcrumbs config={config} />
      <div className="flex h-full min-h-0 w-full overflow-hidden">
        <aside className="hidden h-full w-64 shrink-0 overflow-hidden border-e border-border bg-card md:block">
          <DashboardSidebar config={config} />
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <DashboardHeader navConfig={config} />
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
            <div
              data-dashboard-main-scroll
              className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-4 pb-8 pt-4 md:px-6 md:pb-10 md:pt-6"
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardBreadcrumbsProvider>
  );
}
