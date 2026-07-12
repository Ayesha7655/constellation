export type RolePermission = Readonly<{
  key: string;
  name: string;
  category: string;
  categoryLabel: string;
  description?: string;
}>;

export type RoleSummary = Readonly<{
  key: string;
  displayName: string;
  permissionCount: number;
  permissions: readonly RolePermission[];
}>;

export type RolesListResponse = Readonly<{
  roles: readonly RoleSummary[];
}>;
