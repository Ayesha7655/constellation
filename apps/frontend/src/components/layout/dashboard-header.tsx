'use client';

import type { DashboardNavConfig } from '@/lib/dashboard-nav';
import { BrandLink } from '@/components/layout/brand-link';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { useDashboardBreadcrumbsContext } from '@/contexts/dashboard-breadcrumbs-context';
import { DashboardMobileNav } from '@/components/layout/dashboard-mobile-nav';

type DashboardHeaderProps = Readonly<{
  navConfig: DashboardNavConfig;
}>;

export function DashboardHeader({ navConfig }: DashboardHeaderProps) {
  const { items: breadcrumbItems } = useDashboardBreadcrumbsContext();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <DashboardMobileNav config={navConfig} />
        <BrandLink />
        <span className="hidden shrink-0 text-muted-foreground sm:inline" aria-hidden>
          /
        </span>
        <div className="hidden min-w-0 sm:block">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>
    </header>
  );
}
