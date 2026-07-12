'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { useDashboardBreadcrumbsContext } from '@/contexts/dashboard-breadcrumbs-context';
import { buildDashboardRouteBreadcrumbs } from '@/lib/dashboard-route-breadcrumbs';
import type { DashboardNavConfig } from '@/lib/dashboard-nav';

type DashboardRouteBreadcrumbsProps = Readonly<{
  config: DashboardNavConfig;
}>;

/** Syncs pathname-derived breadcrumbs; page-level overrides take precedence when set. */
export function DashboardRouteBreadcrumbs({ config }: DashboardRouteBreadcrumbsProps) {
  const pathname = usePathname();
  const t = useTranslations('dashboard');
  const { setRouteItems } = useDashboardBreadcrumbsContext();

  const routeItems = useMemo(
    () => buildDashboardRouteBreadcrumbs(pathname, config, t),
    [config, pathname, t],
  );

  useEffect(() => {
    setRouteItems(routeItems);
  }, [routeItems, setRouteItems]);

  return null;
}
