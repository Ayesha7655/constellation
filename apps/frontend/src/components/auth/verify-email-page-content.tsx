'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import {
  hasVerifyEmailSucceeded,
  markVerifyEmailSucceeded,
} from '@/lib/auth/verify-email-session';
import { showAuthError, showAuthSuccess } from '@/components/auth/auth-toast';
import { translateAuthCode } from '@/lib/translate-auth-code';
import { translateAuthRequestError } from '@/lib/user-messages';
import { Link as LocaleLink } from '@/i18n/navigation';
import { verifyEmail } from '@/services/auth-api';

type VerifyState = 'idle' | 'loading' | 'success' | 'error';

function initialVerifyState(oobCode: string): VerifyState {
  if (oobCode.length === 0) {
    return 'idle';
  }
  if (hasVerifyEmailSucceeded(oobCode)) {
    return 'success';
  }
  return 'loading';
}

export function VerifyEmailPageContent() {
  const t = useTranslations('auth.verifyEmail');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations();
  const searchParams = useSearchParams();
  const oobCode = useMemo(() => searchParams.get('oobCode')?.trim() ?? '', [searchParams]);
  const emailHint = useMemo(() => searchParams.get('email')?.trim() ?? '', [searchParams]);
  const [verifyState, setVerifyState] = useState<VerifyState>(() => initialVerifyState(oobCode));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fetchStarted = useRef(false);

  const missingCode = oobCode.length === 0;

  const runVerification = useCallback(async () => {
    try {
      const result = await verifyEmail(oobCode, emailHint || undefined);
      const message = translateAuthCode(result.code, (key) => tErrors(key as never));
      showAuthSuccess(message);
      markVerifyEmailSucceeded(oobCode);
      setVerifyState('success');
    } catch (err) {
      const message = translateAuthRequestError(err, (key) => tErrors(key as never));
      showAuthError(err, (key) => tErrors(key as never));
      setErrorMessage(message);
      setVerifyState('error');
    }
  }, [emailHint, oobCode, tErrors]);

  useEffect(() => {
    if (verifyState !== 'loading' || fetchStarted.current) {
      return;
    }
    fetchStarted.current = true;
    void runVerification();
  }, [oobCode, runVerification, verifyState]);

  const info = verifyState === 'success' ? t('successMessage') : null;
  const error = missingCode
    ? t('missingCode')
    : verifyState === 'error'
      ? errorMessage
      : null;
  const description = missingCode
    ? t('missingCode')
    : verifyState === 'loading'
      ? t('verifying')
      : info || error
        ? ''
        : t('verifying');

  return (
    <AuthPageShell
      title={t('title')}
      description={description}
      error={error}
      info={info}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          <LocaleLink href="/sign-in" className="font-medium text-foreground hover:underline">
            {tCommon('signInLink')}
          </LocaleLink>
        </p>
      }
    >
      {null}
    </AuthPageShell>
  );
}
