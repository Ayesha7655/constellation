'use client';

import { ChevronDown } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useDashboardSession } from '@/contexts/dashboard-session-context';
import {
  isDashboardNavGroupExpandedByDefault,
  isDashboardNavSubGroupExpandedByDefault,
  type DashboardNavConfig,
  type DashboardNavGroup,
  type DashboardNavItem,
  type DashboardNavSubGroup,
} from '@/lib/dashboard-nav';
import { getDashboardNavIcon } from '@/lib/dashboard-nav-icons';
import { filterDashboardNavByPermissions } from '@/lib/filter-dashboard-nav';
import { DashboardSignOutButton } from '@/components/layout/dashboard-sign-out-button';
import { cn } from '@/lib/utils';
import { TEST_IDS } from '@constellation/shared';

type DashboardSidebarProps = Readonly<{
  config: DashboardNavConfig;
  onNavigate?: () => void;
}>;

function isNavItemActive(pathname: string, href: string, basePath: string): boolean {
  if (href === basePath) {
    return pathname === basePath;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getGroupKey(group: DashboardNavGroup): string {
  return group.labelKey ?? group.items[0]?.href ?? 'group';
}

function getSubGroupKey(groupKey: string, subGroup: DashboardNavSubGroup): string {
  return `${groupKey}::${subGroup.labelKey}`;
}

function subGroupHasActiveItem(subGroup: DashboardNavSubGroup, pathname: string, basePath: string): boolean {
  return subGroup.items.some((item) => isNavItemActive(pathname, item.href, basePath));
}

function groupHasActiveItem(group: DashboardNavGroup, pathname: string, basePath: string): boolean {
  const flatActive = group.items.some((item) => isNavItemActive(pathname, item.href, basePath));
  const subActive = (group.subGroups ?? []).some((subGroup) =>
    subGroup.items.some((item) => isNavItemActive(pathname, item.href, basePath)),
  );
  return flatActive || subActive;
}

type TranslateNavLabel = (key: string) => string;

function renderNavItem(
  item: DashboardNavItem,
  pathname: string,
  basePath: string,
  t: TranslateNavLabel,
  onLinkClick: () => void,
  indentClassName?: string,
) {
  const active = isNavItemActive(pathname, item.href, basePath);
  const Icon = getDashboardNavIcon(item.iconKey);

  return (
    <Link
      href={item.href}
      onClick={onLinkClick}
      data-testid={TEST_IDS.dashboardNav.item(item.href)}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
        indentClassName,
        active
          ? 'bg-accent font-medium text-accent-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
      aria-current={active ? 'page' : undefined}
    >
      {Icon ? (
        <Icon
          className={cn('size-4 shrink-0', active ? 'text-accent-foreground' : 'text-primary/70')}
          aria-hidden
        />
      ) : null}
      <span>{t(item.labelKey)}</span>
    </Link>
  );
}

export function DashboardSidebar({ config, onNavigate }: DashboardSidebarProps) {
  const t = useTranslations('dashboard');
  const pathname = usePathname();
  const user = useDashboardSession();
  const { permissions } = user;
  const [expandedOverrides, setExpandedOverrides] = useState<ReadonlyMap<string, boolean>>(() => new Map());

  const navConfig = useMemo(() => {
    const permissionKeys = new Set(permissions.map((permission) => permission.key));
    return filterDashboardNavByPermissions(config, permissionKeys);
  }, [config, permissions]);

  const activeGroupKey = useMemo(() => {
    const activeGroup = navConfig.groups.find(
      (group) => group.labelKey && groupHasActiveItem(group, pathname, navConfig.basePath),
    );
    return activeGroup ? getGroupKey(activeGroup) : null;
  }, [navConfig, pathname]);

  const activeSubGroupKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const group of navConfig.groups) {
      const groupKey = getGroupKey(group);
      for (const subGroup of group.subGroups ?? []) {
        if (subGroupHasActiveItem(subGroup, pathname, navConfig.basePath)) {
          keys.add(getSubGroupKey(groupKey, subGroup));
        }
      }
    }
    return keys;
  }, [navConfig, pathname]);

  const isSectionExpanded = useCallback(
    (sectionKey: string, collapsible: boolean, defaultExpanded: boolean) => {
      if (!collapsible) {
        return true;
      }
      const override = expandedOverrides.get(sectionKey);
      if (override !== undefined) {
        return override;
      }
      return defaultExpanded;
    },
    [expandedOverrides],
  );

  const onLinkClick = useCallback(() => {
    onNavigate?.();
  }, [onNavigate]);

  const onSectionToggle = useCallback((sectionKey: string, defaultExpanded: boolean) => {
    setExpandedOverrides((current) => {
      const next = new Map(current);
      const currentlyExpanded = current.get(sectionKey) ?? defaultExpanded;
      next.set(sectionKey, !currentlyExpanded);
      return next;
    });
  }, []);

  const onGroupToggle = useCallback(
    (group: DashboardNavGroup, groupKey: string) => {
      onSectionToggle(
        groupKey,
        isDashboardNavGroupExpandedByDefault(navConfig.dashboard, group, groupKey, activeGroupKey),
      );
    },
    [activeGroupKey, navConfig.dashboard, onSectionToggle],
  );

  const onSubGroupToggle = useCallback(
    (parentGroup: DashboardNavGroup, subGroupKey: string) => {
      onSectionToggle(
        subGroupKey,
        isDashboardNavSubGroupExpandedByDefault(navConfig.dashboard, parentGroup, subGroupKey, activeSubGroupKeys),
      );
    },
    [activeSubGroupKeys, navConfig.dashboard, onSectionToggle],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-4" aria-label={t(navConfig.titleKey)}>
        {navConfig.groups.map((group) => {
          const groupKey = getGroupKey(group);
          const collapsible = Boolean(group.labelKey);
          const groupDefaultExpanded = isDashboardNavGroupExpandedByDefault(
            navConfig.dashboard,
            group,
            groupKey,
            activeGroupKey,
          );
          const isExpanded = isSectionExpanded(groupKey, collapsible, groupDefaultExpanded);

          return (
            <div key={groupKey} className="flex flex-col gap-1">
              {group.labelKey ? (
                <button
                  type="button"
                  onClick={() => onGroupToggle(group, groupKey)}
                  data-testid={TEST_IDS.dashboardNav.group(groupKey)}
                  aria-expanded={isExpanded}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-start',
                    'text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors',
                    'hover:bg-muted/60 hover:text-foreground',
                  )}
                  aria-label={
                    isExpanded
                      ? t('collapseNavGroup', { group: t(group.labelKey) })
                      : t('expandNavGroup', { group: t(group.labelKey) })
                  }
                >
                  <span>{t(group.labelKey)}</span>
                  <ChevronDown
                    className={cn('size-3.5 shrink-0 transition-transform duration-200', !isExpanded && '-rotate-90')}
                    aria-hidden
                  />
                </button>
              ) : null}
              {isExpanded ? (
                <ul className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <li key={item.href}>{renderNavItem(item, pathname, navConfig.basePath, t, onLinkClick)}</li>
                  ))}
                  {group.subGroups?.map((subGroup) => {
                    const subGroupKey = getSubGroupKey(groupKey, subGroup);
                    const subGroupDefaultExpanded = isDashboardNavSubGroupExpandedByDefault(
                      navConfig.dashboard,
                      group,
                      subGroupKey,
                      activeSubGroupKeys,
                    );
                    const isSubGroupExpanded = isSectionExpanded(subGroupKey, true, subGroupDefaultExpanded);

                    return (
                      <li key={subGroup.labelKey} className="mt-1 flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => onSubGroupToggle(group, subGroupKey)}
                          data-testid={TEST_IDS.dashboardNav.group(subGroupKey)}
                          aria-expanded={isSubGroupExpanded}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 ps-6 text-start',
                            'text-xs font-medium text-muted-foreground transition-colors',
                            'hover:bg-muted/60 hover:text-foreground',
                          )}
                          aria-label={
                            isSubGroupExpanded
                              ? t('collapseNavGroup', { group: t(subGroup.labelKey) })
                              : t('expandNavGroup', { group: t(subGroup.labelKey) })
                          }
                        >
                          <span>{t(subGroup.labelKey)}</span>
                          <ChevronDown
                            className={cn(
                              'size-3.5 shrink-0 transition-transform duration-200',
                              !isSubGroupExpanded && '-rotate-90',
                            )}
                            aria-hidden
                          />
                        </button>
                        {isSubGroupExpanded ? (
                          <ul className="flex flex-col gap-0.5">
                            {subGroup.items.map((item) => (
                              <li key={item.href}>
                                {renderNavItem(item, pathname, navConfig.basePath, t, onLinkClick, 'ps-9')}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-border p-4">
        <DashboardSignOutButton onNavigate={onNavigate} />
      </div>
    </div>
  );
}
