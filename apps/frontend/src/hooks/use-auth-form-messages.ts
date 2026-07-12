'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';

type VerificationContext = 'sign-in' | 'sign-up';

export function useAuthFormMessages() {
  const t = useTranslations('auth.verification');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setInfo(null);
    setVerificationEmail(null);
  }, []);

  const setFormError = useCallback((message: string) => {
    setError(message);
    setInfo(null);
    setVerificationEmail(null);
  }, []);

  const setVerificationInfo = useCallback(
    (email: string, params: { emailSent: boolean; context: VerificationContext }) => {
      setError(null);
      setVerificationEmail(email);
      if (params.context === 'sign-in') {
        setInfo(t('signInPending', { email }));
        return;
      }
      if (params.emailSent) {
        setInfo(t('signUpSent', { email }));
        return;
      }
      setInfo(t('signUpNotSent'));
    },
    [t],
  );

  return {
    error,
    info,
    verificationEmail,
    clearMessages,
    setFormError,
    setVerificationInfo,
  };
}
