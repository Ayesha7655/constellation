'use client';

import { useCallback, useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { useTranslations } from 'next-intl';
import { translateFirebaseError } from '@/lib/firebase-auth-errors';
import { resolveFirebaseUserEmail } from '@/lib/firebase-user-email';
import { getFirebaseAuth, getGoogleProvider } from '@/services/firebase';

export type JoinGoogleAuthResult = Readonly<{
  idToken: string;
  email: string;
  name: string;
}>;

export function useJoinGoogleAuth(options: { onError: (message: string) => void }) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  const signInWithGoogleForJoin = useCallback(async (): Promise<JoinGoogleAuthResult | null> => {
    setLoading(true);
    try {
      const credential = await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
      await credential.user.reload();
      const email = await resolveFirebaseUserEmail(credential.user);
      if (!email) {
        options.onError(t('errors.api.firebaseAccountNoEmail'));
        return null;
      }
      const idToken = await credential.user.getIdToken();
      return {
        idToken,
        email,
        name: credential.user.displayName?.trim() || '',
      };
    } catch (error) {
      options.onError(translateFirebaseError(error, (key) => t(key as never), 'errors.googleSignInFailed'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [options, t]);

  return { loading, signInWithGoogleForJoin };
}
