'use client';

import { useCallback, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { useTranslations } from 'next-intl';
import { translateFirebaseError } from '@/lib/firebase-auth-errors';
import { AuthRequestError, translateAuthRequestError } from '@/lib/user-messages';
import { getFirebaseAuth, getGoogleProvider } from '@/services/firebase';
import { firebaseLogin, sendVerificationEmail } from '@/services/auth-api';
import type { AuthTokens } from '@/lib/auth-session';

type VerificationPendingParams = Readonly<{
  email: string;
  emailSent: boolean;
  context: 'sign-in' | 'sign-up';
}>;

export function useFirebaseAuth(options: {
  onSuccess: (tokens: AuthTokens) => void;
  onError: (message: string) => void;
  onVerificationPending?: (params: VerificationPendingParams) => void;
}) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  const runAuthAction = useCallback(async (action: () => Promise<void>, fallbackKey: string) => {
    setLoading(true);
    try {
      await action();
    } catch (err) {
      const translate = (key: string) => t(key as never);
      if (err instanceof AuthRequestError) {
        options.onError(translateAuthRequestError(err, translate));
      } else {
        options.onError(translateFirebaseError(err, translate, fallbackKey));
      }
    } finally {
      setLoading(false);
    }
  }, [options, t]);

  const exchangeToken = useCallback(async (idToken: string, name?: string) => {
    const result = await firebaseLogin({ idToken, name });
    options.onSuccess({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      role: result.role,
      dashboardHomePath: result.dashboardHomePath,
    });
  }, [options]);

  const performSignInWithEmail = useCallback(async (email: string, password: string) => {
    const trimmedEmail = email.trim();
    const credential = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      trimmedEmail,
      password,
    );
    if (!credential.user.emailVerified) {
      options.onVerificationPending?.({
        email: trimmedEmail,
        emailSent: false,
        context: 'sign-in',
      });
      return;
    }
    const idToken = await credential.user.getIdToken();
    await exchangeToken(idToken);
  }, [exchangeToken, options]);

  const performSignUpWithEmail = useCallback(async (params: {
    email: string;
    password: string;
    name: string;
  }) => {
    const email = params.email.trim();
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email,
      params.password,
    );
    await updateProfile(credential.user, {
      displayName: params.name.trim(),
    });
    try {
      await sendVerificationEmail(email);
      options.onVerificationPending?.({ email, emailSent: true, context: 'sign-up' });
    } catch {
      options.onVerificationPending?.({ email, emailSent: false, context: 'sign-up' });
    }
  }, [options]);

  const performResendVerification = useCallback(async (email: string, context: 'sign-in' | 'sign-up') => {
    const trimmedEmail = email.trim();
    await sendVerificationEmail(trimmedEmail);
    options.onVerificationPending?.({
      email: trimmedEmail,
      emailSent: true,
      context,
    });
  }, [options]);

  const performGoogleSignIn = useCallback(async () => {
    const credential = await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
    const idToken = await credential.user.getIdToken();
    await exchangeToken(idToken, credential.user.displayName ?? undefined);
  }, [exchangeToken]);

  const signInWithEmail = useCallback((email: string, password: string) =>
    runAuthAction(() => performSignInWithEmail(email, password), 'errors.signInFailed'), [performSignInWithEmail, runAuthAction]);

  const signUpWithEmail = useCallback((params: {
    email: string;
    password: string;
    name: string;
  }) =>
    runAuthAction(() => performSignUpWithEmail(params), 'errors.signUpFailed'), [performSignUpWithEmail, runAuthAction]);

  const resendVerificationEmail = useCallback((email: string, context: 'sign-in' | 'sign-up') =>
    runAuthAction(() => performResendVerification(email, context), 'errors.resendVerificationFailed'),
    [performResendVerification, runAuthAction]);

  const signInWithGoogle = useCallback(() =>
    runAuthAction(performGoogleSignIn, 'errors.googleSignInFailed'), [performGoogleSignIn, runAuthAction]);

  return {
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resendVerificationEmail,
  };
}
