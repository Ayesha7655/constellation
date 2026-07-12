'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { Link } from '@/i18n/navigation';

export function ResetPasswordPageContent() {
  const t = useTranslations('auth.resetPassword');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();
  const oobCode = useMemo(() => searchParams.get('oobCode')?.trim() ?? '', [searchParams]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const clearMessages = useCallback(() => {
    setError(null);
    setInfo(null);
  }, []);

  const handleSuccess = useCallback((message: string) => {
    setCompleted(true);
    setInfo(message);
  }, []);

  const missingCode = oobCode.length === 0;

  return (
    <AuthPageShell
      title={t('title')}
      description={t('description')}
      error={missingCode ? t('missingCode') : error}
      info={info}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/sign-in" className="font-medium text-foreground hover:underline">
            {tCommon('backToSignIn')}
          </Link>
        </p>
      }
    >
      {!missingCode && !completed ? (
        <ResetPasswordForm
          oobCode={oobCode}
          clearMessages={clearMessages}
          onSuccess={handleSuccess}
          onError={setError}
        />
      ) : null}
    </AuthPageShell>
  );
}
