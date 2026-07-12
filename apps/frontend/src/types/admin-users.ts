import type { PaginationMeta } from '@/types/pagination';

export type AdminUserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'DELETED';

export type AdminUserManageableStatus = 'ACTIVE' | 'DEACTIVATED';

export type AdminUserRoleSummary = Readonly<{
  key: string;
  label: string;
}>;

export type AdminUserSummary = Readonly<{
  id: string;
  name: string;
  email: string;
  status: AdminUserStatus;
  primaryRole: AdminUserRoleSummary;
  roles: readonly AdminUserRoleSummary[];
  orgId: string | null;
  orgName: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}>;

export type AdminUserDetail = AdminUserSummary &
  Readonly<{
    orgAddress: string | null;
  }>;

export type UsersListResponse = Readonly<{
  users: readonly AdminUserSummary[];
  meta: PaginationMeta;
}>;

export type UserFilterRolesResponse = Readonly<{
  roles: readonly AdminUserRoleSummary[];
}>;

export type UserStatusFilter = 'ALL' | AdminUserManageableStatus;

export type UserRoleFilter = 'ALL' | string;
