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
  SCRAPE_RUNS_READ: 'org.scrape_runs.read',
  SCRAPE_RUNS_CREATE: 'org.scrape_runs.create',
  UPWORK_JOBS_READ: 'org.upwork_jobs.read',
  UPWORK_SCORING_READ: 'org.upwork_scoring.read',
  UPWORK_SCORING_UPDATE: 'org.upwork_scoring.update',
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
