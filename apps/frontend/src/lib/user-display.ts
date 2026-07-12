import type { AdminUserDetail, AdminUserRoleSummary, AdminUserStatus } from '@/types/admin-users';
import { roleStatusBadgeVariant } from '@/lib/profile-badge-variants';

type UserRolesContext = Readonly<{
  primaryRole: AdminUserRoleSummary;
  roles: readonly AdminUserRoleSummary[];
}>;

export function userDisplayName(user: Pick<AdminUserDetail, 'name' | 'orgName'>): string {
  return user.orgName ?? user.name;
}

export function mergeUserRolesForDisplay(user: UserRolesContext): readonly AdminUserRoleSummary[] {
  const byKey = new Map(user.roles.map((role) => [role.key, role]));
  if (!byKey.has(user.primaryRole.key)) {
    byKey.set(user.primaryRole.key, user.primaryRole);
  }
  return [...byKey.values()].sort((a, b) => {
    if (a.key === user.primaryRole.key) {
      return -1;
    }
    if (b.key === user.primaryRole.key) {
      return 1;
    }
    return a.label.localeCompare(b.label);
  });
}

export function userRoleBadgeVariant(roleKey: string, primaryRoleKey: string): ReturnType<typeof roleStatusBadgeVariant> {
  if (roleKey === primaryRoleKey) {
    return roleStatusBadgeVariant(roleKey);
  }
  return 'secondary';
}

export function userStatusVariant(status: AdminUserStatus): ReturnType<typeof roleStatusBadgeVariant> {
  switch (status) {
    case 'ACTIVE':
      return 'approved';
    case 'DEACTIVATED':
      return 'inactive';
    default:
      return 'pending';
  }
}

export function canDeactivateUser(user: Pick<AdminUserDetail, 'status'>): boolean {
  return user.status === 'ACTIVE';
}

export function canReactivateUser(user: Pick<AdminUserDetail, 'status'>): boolean {
  return user.status === 'DEACTIVATED' || user.status === 'SUSPENDED';
}
