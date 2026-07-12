/** Stable keys for `staleness_policy` rows (text PK). Engine ordering uses `sequence`; keys are for config identity and ops. */
export const STALENESS_POLICY_KEY = {
  STALE_REMINDER_1: 'stale_reminder_1',
  STALE_REMINDER_2: 'stale_reminder_2',
  STALE_ADMIN_REVIEW: 'stale_admin_review',
} as const;

export type StalenessPolicyKey = (typeof STALENESS_POLICY_KEY)[keyof typeof STALENESS_POLICY_KEY];
