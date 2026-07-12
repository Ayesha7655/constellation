import { DASHBOARD_BASE_PATH, SUPER_ADMIN_ROLE_KEY } from './roles';

export const ORG_ACCOUNT_TYPE_KEY = 'org';
export const SUPER_ADMIN_ACCOUNT_TYPE_KEY = 'super-admin';

export const ACCOUNT_TYPE_DASHBOARD_HOME: Readonly<Record<string, string>> = {
  [ORG_ACCOUNT_TYPE_KEY]: DASHBOARD_BASE_PATH.org,
  [SUPER_ADMIN_ACCOUNT_TYPE_KEY]: DASHBOARD_BASE_PATH.superAdmin,
};

export const PLATFORM_ACCOUNT_TYPE_KEYS = [ORG_ACCOUNT_TYPE_KEY, SUPER_ADMIN_ACCOUNT_TYPE_KEY] as const;

export type PlatformAccountTypeKey = (typeof PLATFORM_ACCOUNT_TYPE_KEYS)[number];

export function resolveDashboardHomePath(accountTypeKey: string): string | null {
  return ACCOUNT_TYPE_DASHBOARD_HOME[accountTypeKey] ?? null;
}

export function resolveDashboardProfilePathFromHome(dashboardHomePath: string): string {
  if (dashboardHomePath === DASHBOARD_BASE_PATH.superAdmin) {
    return `${DASHBOARD_BASE_PATH.superAdmin}/settings`;
  }
  return `${dashboardHomePath}/profile`;
}

export function resolveDashboardHomePathForRole(roleKey: string): string {
  if (roleKey === SUPER_ADMIN_ROLE_KEY) {
    return DASHBOARD_BASE_PATH.superAdmin;
  }
  return DASHBOARD_BASE_PATH.org;
}
