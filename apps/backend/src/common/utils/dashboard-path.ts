import { SUPER_ADMIN_ROLE_KEY } from '@constellation/shared';

export function resolveDashboardHomePath(roleKey: string): string {
  if (roleKey === SUPER_ADMIN_ROLE_KEY) {
    return '/admin';
  }
  return '/dashboard';
}

export function isOrgProfileComplete(org: { name: string | null; address: string | null } | null | undefined): boolean {
  if (!org) {
    return true;
  }
  return Boolean(org.name?.trim() && org.address?.trim());
}
