'use client';

import { useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { useAuthFormMessages } from '@/hooks/use-auth-form-messages';
import { persistAuthSession } from '@/lib/auth-session';
import type { AuthTokens } from '@/lib/auth-session';

export function useAuthSubmit() {
  const router = useRouter();
  const messages = useAuthFormMessages();

  const handleAuthSuccess = useCallback((tokens: AuthTokens) => {
    persistAuthSession(tokens);
    router.push(tokens.dashboardHomePath ?? '/');
    router.refresh();
  }, [router]);

  const handleVerificationPending = useCallback((params: {
    email: string;
    emailSent: boolean;
    context: 'sign-in' | 'sign-up';
  }) => {
    messages.setVerificationInfo(params.email, params);
  }, [messages]);

  const { loading, signInWithEmail, signUpWithEmail, signInWithGoogle, resendVerificationEmail } =
    useFirebaseAuth({
      onSuccess: handleAuthSuccess,
      onError: messages.setFormError,
      onVerificationPending: handleVerificationPending,
    });

  return {
    loading,
    messages,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resendVerificationEmail,
  };
}

export type AuthSubmitHandle = ReturnType<typeof useAuthSubmit>;
