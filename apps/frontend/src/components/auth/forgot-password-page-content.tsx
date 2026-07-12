'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { Link } from '@/i18n/navigation';

export function ForgotPasswordPageContent() {
  const t = useTranslations('auth.forgotPassword');
  const tCommon = useTranslations('common');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const clearMessages = useCallback(() => {
    setError(null);
    setInfo(null);
  }, []);

  const handleSuccess = useCallback((message: string) => {
    setSubmitted(true);
    setInfo(message);
  }, []);

  return (
    <AuthPageShell
      title={t('title')}
      description={t('description')}
      error={error}
      info={info}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/sign-in" className="font-medium text-foreground hover:underline">
            {tCommon('backToSignIn')}
          </Link>
        </p>
      }
    >
      {submitted ? null : (
        <ForgotPasswordForm
          clearMessages={clearMessages}
          onSuccess={handleSuccess}
          onError={setError}
        />
      )}
    </AuthPageShell>
  );
}
