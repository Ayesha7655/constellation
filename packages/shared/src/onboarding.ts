export const ACCOUNT_TYPE_PARTNER = 'partner';
export const ACCOUNT_TYPE_SELLER = 'seller';

export const ACCOUNT_TYPE_KEYS = [ACCOUNT_TYPE_PARTNER, ACCOUNT_TYPE_SELLER] as const;
export type AccountTypeKey = (typeof ACCOUNT_TYPE_KEYS)[number];

export const TEAM_APPLICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type TeamApplicationStatus = (typeof TEAM_APPLICATION_STATUS)[keyof typeof TEAM_APPLICATION_STATUS];

export const ONBOARDING_UPLOAD_MODULE = 'onboarding';

/** Team join / seller-upgrade document uploads (UI copy and validation). */
export const ONBOARDING_MAX_FILE_SIZE_MB = 10;
export const ONBOARDING_MAX_FILE_SIZE_BYTES = ONBOARDING_MAX_FILE_SIZE_MB * 1024 * 1024;

/** Header required on POST /onboarding/uploads — must match backend ONBOARDING_UPLOAD_API_KEY. */
export const ONBOARDING_UPLOAD_KEY_HEADER = 'x-onboarding-upload-key';
