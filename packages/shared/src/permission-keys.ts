export const PLATFORM = {
  HEALTH: 'platform.health',
} as const;

export const ORG = {
  PROFILE_READ: 'org.profile.read',
  PROFILE_UPDATE: 'org.profile.update',
  DASHBOARD_ACCESS: 'org.dashboard.access',
  FREELANCER_PROFILE_READ: 'org.freelancer_profile.read',
  FREELANCER_PROFILE_UPDATE: 'org.freelancer_profile.update',
  SEARCH_FILTERS_READ: 'org.search_filters.read',
  SEARCH_FILTERS_UPDATE: 'org.search_filters.update',
} as const;

export const ACCOUNT = {
  MANAGE_SETTINGS: 'account.manage_settings',
} as const;

export const ADMIN = {
  USERS_READ: 'admin.users.read',
  USERS_UPDATE: 'admin.users.update',
  ROLES_READ: 'admin.roles.read',
  PLATFORM_MANAGE: 'admin.platform.manage',
} as const;

export type PermissionKey =
  | (typeof PLATFORM)[keyof typeof PLATFORM]
  | (typeof ORG)[keyof typeof ORG]
  | (typeof ACCOUNT)[keyof typeof ACCOUNT]
  | (typeof ADMIN)[keyof typeof ADMIN];
