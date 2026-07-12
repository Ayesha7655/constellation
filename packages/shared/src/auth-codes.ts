/** Stable auth API result codes — frontend maps `errors.${code}` via next-intl. */
export const AUTH_RESULT_CODES = {
  PASSWORD_RESET_ACK: 'auth.password_reset_ack',
  VERIFICATION_EMAIL_ACK: 'auth.verification_email_ack',
  VERIFY_EMAIL_SUCCESS: 'auth.verify_email_success',
  RESET_PASSWORD_SUCCESS: 'auth.reset_password_success',
  PASSWORD_CHANGED: 'auth.password_changed',
  SESSIONS_REVOKED: 'auth.sessions_revoked',
  SESSIONS_NONE_REVOKED: 'auth.sessions_none_revoked',
} as const;

export type AuthResultCode = (typeof AUTH_RESULT_CODES)[keyof typeof AUTH_RESULT_CODES];

/** Stable auth API error codes — frontend maps `errors.${code}` via next-intl. */
export const AUTH_ERROR_CODES = {
  CURRENT_PASSWORD_INCORRECT: 'auth.current_password_incorrect',
  PASSWORD_CHANGE_UNAVAILABLE: 'auth.password_change_unavailable',
  TOO_MANY_ATTEMPTS: 'auth.too_many_attempts',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export const AUTH_API_CODES = {
  ...AUTH_RESULT_CODES,
  ...AUTH_ERROR_CODES,
} as const;

export type AuthApiCode = (typeof AUTH_API_CODES)[keyof typeof AUTH_API_CODES];

/** next-intl key for any backend code (e.g. `auth.password_changed` → `errors.auth.password_changed`,
 * `api.manufacturer.key_exists` → `errors.api.manufacturer.key_exists`). */
export function codeToMessageKey(code: string): `errors.${string}` {
  return `errors.${code}`;
}

/** @deprecated use {@link codeToMessageKey} — retained as a back-compat alias for existing auth consumers. */
export const authCodeToMessageKey = codeToMessageKey;
