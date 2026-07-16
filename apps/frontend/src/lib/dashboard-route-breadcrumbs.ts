import type { BreadcrumbItem } from '@/components/ui/breadcrumbs';
import type { DashboardNavConfig } from '@/lib/dashboard-nav';

type TranslateDashboard = (key: string) => string;

type NavRoute = Readonly<{
  href: string;
  labelKey: string;
}>;

type BreadcrumbRef = Readonly<{
  href: string;
  labelKey: string;
}>;

type DynamicRouteRule = Readonly<{
  pattern: RegExp;
  labelKey: string;
  ancestors: readonly BreadcrumbRef[];
}>;

function collectNavRoutes(config: DashboardNavConfig): readonly NavRoute[] {
  const routes: NavRoute[] = [];
  for (const group of config.groups) {
    for (const item of group.items) {
      routes.push({ href: item.href, labelKey: item.labelKey });
    }
    for (const subGroup of group.subGroups ?? []) {
      for (const item of subGroup.items) {
        routes.push({ href: item.href, labelKey: item.labelKey });
      }
    }
  }
  return routes.sort((a, b) => b.href.length - a.href.length);
}

function dynamicRouteRules(config: DashboardNavConfig): readonly DynamicRouteRule[] {
  const base = config.basePath;

  if (base === '/admin') {
    return [
      {
        pattern: new RegExp(`^${base}/users/[^/]+$`),
        labelKey: 'admin.users.detail.title',
        ancestors: [{ href: `${base}/users`, labelKey: 'admin.nav.users' }],
      },
    ];
  }

  if (base === '/dashboard') {
    return [
      {
        pattern: new RegExp(`^${base}/upwork/profile/draft$`),
        labelKey: 'org.pages.upworkProfileDraft.title',
        ancestors: [{ href: `${base}/upwork/profile`, labelKey: 'org.nav.upworkProfile' }],
      },
      {
        pattern: new RegExp(`^${base}/upwork/profile/[^/]+$`),
        labelKey: 'org.pages.upworkProfileDetail.title',
        ancestors: [{ href: `${base}/upwork/profile`, labelKey: 'org.nav.upworkProfile' }],
      },
      {
        pattern: new RegExp(`^${base}/upwork/jobs/[^/]+$`),
        labelKey: 'org.pages.upworkJobDetail.title',
        ancestors: [{ href: `${base}/upwork/jobs`, labelKey: 'org.nav.upworkJobs' }],
      },
    ];
  }

  return [];
}

function resolveDynamicRule(pathname: string, rules: readonly DynamicRouteRule[]): DynamicRouteRule | null {
  return rules.find((rule) => rule.pattern.test(pathname)) ?? null;
}

export function buildDashboardRouteBreadcrumbs(
  pathname: string,
  config: DashboardNavConfig,
  t: TranslateDashboard,
): readonly BreadcrumbItem[] {
  const navRoutes = collectNavRoutes(config);
  const exact = navRoutes.find((route) => route.href === pathname);
  if (exact) {
    return [{ label: t(exact.labelKey), href: exact.href }];
  }

  const dynamicRules = dynamicRouteRules(config);
  const dynamic = resolveDynamicRule(pathname, dynamicRules);
  if (dynamic) {
    return [
      ...dynamic.ancestors.map((ancestor) => ({
        label: t(ancestor.labelKey),
        href: ancestor.href,
      })),
      { label: t(dynamic.labelKey), href: pathname },
    ];
  }

  const prefix = navRoutes.find((route) => pathname.startsWith(`${route.href}/`));
  if (prefix) {
    return [{ label: t(prefix.labelKey), href: prefix.href }];
  }

  if (pathname === config.basePath) {
    const overview = navRoutes.find((route) => route.href === config.basePath);
    if (overview) {
      return [{ label: t(overview.labelKey), href: overview.href }];
    }
  }

  return [];
}
