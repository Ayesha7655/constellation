import type { User } from 'firebase/auth';

/** Read email from a decoded Firebase ID token payload (unverified — display/eligibility only). */
export function emailFromFirebaseIdToken(idToken: string): string | undefined {
  const parts = idToken.split('.');
  if (parts.length < 2) {
    return undefined;
  }

  try {
    const payload = JSON.parse(
      atob(parts[1]!.replace(/-/g, '+').replace(/_/g, '/')),
    ) as {
      email?: string;
      firebase?: { identities?: { email?: string[] } };
    };

    const direct = payload.email?.trim();
    if (direct) {
      return direct;
    }

    const fromIdentities = payload.firebase?.identities?.email?.[0]?.trim();
    return fromIdentities || undefined;
  } catch {
    return undefined;
  }
}

/** Google sign-in may leave `user.email` empty while provider data or the ID token still has it. */
export async function resolveFirebaseUserEmail(user: User): Promise<string | undefined> {
  const direct = user.email?.trim();
  if (direct) {
    return direct;
  }

  const googleProvider = user.providerData.find((provider) => provider.providerId === 'google.com');
  const googleEmail = googleProvider?.email?.trim();
  if (googleEmail) {
    return googleEmail;
  }

  for (const provider of user.providerData) {
    const providerEmail = provider.email?.trim();
    if (providerEmail) {
      return providerEmail;
    }
  }

  const idToken = await user.getIdToken();
  return emailFromFirebaseIdToken(idToken);
}
