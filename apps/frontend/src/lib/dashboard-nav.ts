import { ADMIN } from '@constellation/shared';
import { DASHBOARD_BASE_PATH } from '@/lib/roles';
import type { DashboardNavIconKey } from '@/lib/dashboard-nav-icons';

export type DashboardNavItem = Readonly<{
  href: string;
  labelKey: string;
  iconKey?: DashboardNavIconKey;
  permissionKey?: (typeof ADMIN)[keyof typeof ADMIN];
  permissionAnyKeys?: readonly (typeof ADMIN)[keyof typeof ADMIN][];
}>;

export type DashboardNavSubGroup = Readonly<{
  labelKey: string;
  items: readonly DashboardNavItem[];
}>;

export type DashboardNavGroup = Readonly<{
  labelKey?: string;
  items: readonly DashboardNavItem[];
  subGroups?: readonly DashboardNavSubGroup[];
}>;

export type DashboardNavConfig = Readonly<{
  dashboard: 'superAdmin' | 'org';
  basePath: string;
  titleKey: string;
  groups: readonly DashboardNavGroup[];
}>;

export function isDashboardNavGroupExpandedByDefault(
  _dashboard: DashboardNavConfig['dashboard'],
  group: DashboardNavGroup,
  groupKey: string,
  activeGroupKey: string | null,
): boolean {
  if (!group.labelKey) {
    return true;
  }
  return groupKey === activeGroupKey;
}

export function isDashboardNavSubGroupExpandedByDefault(
  _dashboard: DashboardNavConfig['dashboard'],
  _parentGroup: DashboardNavGroup,
  subGroupKey: string,
  activeSubGroupKeys: ReadonlySet<string>,
): boolean {
  return activeSubGroupKeys.has(subGroupKey);
}

export const adminDashboardNav: DashboardNavConfig = {
  dashboard: 'superAdmin',
  basePath: DASHBOARD_BASE_PATH.superAdmin,
  titleKey: 'admin.title',
  groups: [
    {
      items: [
        {
          href: DASHBOARD_BASE_PATH.superAdmin,
          labelKey: 'admin.nav.overview',
          iconKey: 'layoutDashboard',
        },
      ],
    },
    {
      labelKey: 'admin.nav.platformGroup',
      items: [
        {
          href: `${DASHBOARD_BASE_PATH.superAdmin}/users`,
          labelKey: 'admin.nav.users',
          iconKey: 'users',
          permissionKey: ADMIN.USERS_READ,
        },
        {
          href: `${DASHBOARD_BASE_PATH.superAdmin}/access-control`,
          labelKey: 'admin.nav.rolesAndPermissions',
          iconKey: 'keyRound',
          permissionKey: ADMIN.ROLES_READ,
        },
      ],
    },
    {
      labelKey: 'admin.nav.manageGroup',
      items: [
        {
          href: `${DASHBOARD_BASE_PATH.superAdmin}/settings`,
          labelKey: 'admin.nav.settings',
          iconKey: 'settings',
        },
      ],
    },
  ],
};

export const orgDashboardNav: DashboardNavConfig = {
  dashboard: 'org',
  basePath: DASHBOARD_BASE_PATH.org,
  titleKey: 'org.title',
  groups: [
    {
      items: [
        {
          href: DASHBOARD_BASE_PATH.org,
          labelKey: 'org.nav.overview',
          iconKey: 'layoutDashboard',
        },
      ],
    },
    {
      labelKey: 'org.nav.accountGroup',
      items: [
        {
          href: `${DASHBOARD_BASE_PATH.org}/profile`,
          labelKey: 'org.nav.profile',
          iconKey: 'user',
        },
      ],
    },
  ],
};
