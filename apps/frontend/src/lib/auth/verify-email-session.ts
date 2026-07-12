const VERIFY_EMAIL_SESSION_PREFIX = 'constellation:verify-email:';

export function getVerifyEmailSessionKey(oobCode: string): string {
  return `${VERIFY_EMAIL_SESSION_PREFIX}${oobCode}`;
}

/** True only after the verify API succeeded for this oobCode (same tab session). */
export function hasVerifyEmailSucceeded(oobCode: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return sessionStorage.getItem(getVerifyEmailSessionKey(oobCode)) === 'success';
}

export function markVerifyEmailSucceeded(oobCode: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.setItem(getVerifyEmailSessionKey(oobCode), 'success');
}
