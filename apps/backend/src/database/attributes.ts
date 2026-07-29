export const USER_ID_ATTRS = ['id'] as const;

export const USER_PRIMARY_ROLE_KEY_ATTRS = ['primaryRoleKey'] as const;

export const USER_AUTH_LOOKUP_ATTRS = [
  'id',
  'email',
  'firebaseUid',
  'authProvider',
  'status',
  'primaryRoleKey',
  'photoUrl',
  'emailVerifiedAt',
] as const;

export const USER_LOGIN_LOOKUP_ATTRS = [
  'id',
  'firebaseUid',
  'email',
  'status',
  'photoUrl',
  'emailVerifiedAt',
  'primaryRoleKey',
] as const;

export const USER_STATUS_ATTRS = ['status'] as const;

export const USER_PROFILE_ATTRS = [
  'id',
  'name',
  'email',
  'photoUrl',
  'status',
  'authProvider',
  'orgId',
  'primaryRoleKey',
] as const;

export const USER_SESSION_CREATE_ATTRS = ['name', 'deletedAt', 'status', 'primaryRoleKey'] as const;

export const USER_SESSION_REFRESH_ATTRS = ['email', 'name', 'deletedAt', 'status', 'primaryRoleKey'] as const;

export const USER_CHANGE_PASSWORD_ATTRS = ['id', 'email', 'firebaseUid', 'authProvider'] as const;

export const USER_FIREBASE_UID_ATTRS = ['firebaseUid'] as const;

export const USER_ORG_LOOKUP_ATTRS = ['id', 'orgId'] as const;

export const USER_ADMIN_LIST_ATTRS = [
  'id',
  'name',
  'email',
  'status',
  'orgId',
  'primaryRoleKey',
  'firebaseUid',
  'createdAt',
  'lastLoginAt',
] as const;

export const ROLE_KEY_ATTRS = ['key'] as const;

export const ROLE_FILTER_ATTRS = ['key', 'displayName'] as const;

export const ROLE_PROFILE_ATTRS = ['key', 'displayName'] as const;

export const ROLE_ADMIN_LIST_ATTRS = ['key', 'displayName', 'createdAt'] as const;

export const USER_ROLE_MEMBERSHIP_ATTRS = ['userId', 'roleKey'] as const;

export const ORG_PROFILE_ATTRS = ['id', 'name', 'address'] as const;

export const ORG_SUMMARY_ATTRS = ['id', 'name'] as const;

export const SESSION_LIST_ATTRS = [
  'id',
  'deviceId',
  'platform',
  'ipAddress',
  'userAgent',
  'createdAt',
  'lastActiveAt',
] as const;

export const SESSION_DEVICE_LOOKUP_ATTRS = ['id'] as const;

export const SESSION_ACTIVE_ROLE_ATTRS = ['activeRoleKey'] as const;

export const SESSION_REFRESH_VALID_ATTRS = ['id'] as const;

export const SESSION_ACCESS_VALID_ATTRS = ['userId'] as const;

export const ROLE_PERMISSION_KEY_ATTRS = ['permissionKey'] as const;

export const ROLE_PERMISSION_JOIN_ATTRS = ['roleKey', 'permissionKey'] as const;

export const PERMISSION_CATALOG_ATTRS = ['key', 'name', 'description', 'category', 'sortOrder'] as const;

export const PERMISSION_CATEGORY_LABEL_ATTRS = ['label'] as const;

export const FREELANCER_PROFILE_ATTRS = [
  'id',
  'orgId',
  'label',
  'title',
  'overview',
  'skills',
  'hourlyRateMin',
  'hourlyRateMax',
  'country',
  'timezone',
  'languages',
  'exclusions',
  'profileUrl',
  'source',
  'updatedAt',
  'createdAt',
] as const;

/** Match import drafts to existing org profiles by URL / Upwork UID. */
export const FREELANCER_PROFILE_MATCH_ATTRS = ['id', 'profileUrl', 'rawSnapshot'] as const;

export const PROFILE_IMPORT_DRAFT_ATTRS = ['id', 'orgId', 'payload', 'createdAt', 'expiresAt'] as const;

export const SEARCH_FILTER_SET_ATTRS = [
  'id',
  'orgId',
  'freelancerProfileId',
  'actorId',
  'filters',
  'provenance',
  'updatedByUserId',
  'updatedAt',
] as const;

export const EXTENSION_PAIRING_CODE_ATTRS = [
  'id',
  'code',
  'userId',
  'orgId',
  'expiresAt',
  'consumedAt',
] as const;

export const SCRAPE_RUN_ATTRS = [
  'id',
  'orgId',
  'freelancerProfileId',
  'status',
  'trigger',
  'actorId',
  'apifyRunId',
  'filtersSnapshot',
  'error',
  'totalFetched',
  'totalFiltered',
  'totalSaved',
  'totalNew',
  'startedAt',
  'finishedAt',
  'createdAt',
  'updatedAt',
] as const;

export const UPWORK_JOB_ATTRS = [
  'id',
  'orgId',
  'externalJobId',
  'jobUrl',
  'title',
  'description',
  'budget',
  'jobType',
  'experienceLevel',
  'clientLocation',
  'clientRating',
  'clientSpent',
  'skills',
  'proposals',
  'postedTime',
  'postedAt',
  'scrapeRunId',
  'rawPayload',
  'scrapedAt',
  'createdAt',
  'updatedAt',
] as const;

export const SCRAPE_RUN_JOB_ATTRS = [
  'id',
  'orgId',
  'scrapeRunId',
  'upworkJobId',
  'freelancerProfileId',
  'isNew',
  'createdAt',
] as const;

export const PROPOSAL_STYLE_PACK_ATTRS = [
  'id',
  'orgId',
  'freelancerProfileId',
  'preferences',
  'createdAt',
  'updatedAt',
] as const;

export const PROPOSAL_EXAMPLE_ATTRS = [
  'id',
  'orgId',
  'freelancerProfileId',
  'title',
  'body',
  'jobContext',
  'isStarred',
  'source',
  'createdAt',
  'updatedAt',
] as const;

export const PROPOSAL_DRAFT_ATTRS = [
  'id',
  'orgId',
  'freelancerProfileId',
  'upworkJobId',
  'body',
  'status',
  'provenance',
  'source',
  'modelMeta',
  'createdAt',
  'updatedAt',
] as const;

export const PROPOSAL_ATTACHMENT_ATTRS = [
  'id',
  'orgId',
  'freelancerProfileId',
  'proposalDraftId',
  'proposalExampleId',
  'storageKey',
  'fileName',
  'mimeType',
  'sizeBytes',
  'sortOrder',
  'createdAt',
  'updatedAt',
] as const;

export const PORTFOLIO_PROJECT_ATTRS = [
  'id',
  'freelancerProfileId',
  'externalId',
  'title',
  'role',
  'description',
  'technologies',
  'links',
  'imageUrls',
  'publishedOn',
  'source',
  'scrapedAt',
  'createdAt',
  'updatedAt',
] as const;

export const ORG_EXTENSION_ATTRS = ['id', 'extensionConnectedAt'] as const;
export const ORG_SCORING_ATTRS = ['id', 'upworkScoringConfig'] as const;
