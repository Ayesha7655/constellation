import type { DecodedIdToken } from 'firebase-admin/auth';

/** Top-level `email` is sometimes missing; Google sign-in often stores it under `firebase.identities.email`. */
export function emailFromFirebaseToken(decoded: DecodedIdToken): string | undefined {
  const direct = decoded.email?.trim();
  if (direct) {
    return direct;
  }

  const identities = decoded.firebase?.identities;
  if (!identities || typeof identities !== 'object') {
    return undefined;
  }

  const emailIdentity = (identities as Record<string, unknown>).email;
  if (Array.isArray(emailIdentity) && typeof emailIdentity[0] === 'string') {
    const fromIdentities = emailIdentity[0].trim();
    return fromIdentities || undefined;
  }

  return undefined;
}
