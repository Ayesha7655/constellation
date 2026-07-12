'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { ResetPasswordPageContent } from '@/components/auth/reset-password-page-content';

function ResetPasswordFallback() {
  const t = useTranslations('common');
  return (
    <p className="text-center text-sm text-muted-foreground">{t('waiting')}</p>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
