'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { VerifyEmailPageContent } from '@/components/auth/verify-email-page-content';

function VerifyEmailFallback() {
  const t = useTranslations('common');
  return (
    <p className="text-center text-sm text-muted-foreground">{t('waiting')}</p>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
