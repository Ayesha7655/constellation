'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@constellation/shared/ui';
import { TEST_IDS } from '@constellation/shared';

type VerificationResendSectionProps = Readonly<{
  email: string;
  loading: boolean;
  onResend: () => void;
}>;

export function VerificationResendSection({
  email,
  loading,
  onResend,
}: VerificationResendSectionProps) {
  const t = useTranslations('auth.verification');
  const tCommon = useTranslations('common');

  return (
    <div data-testid={TEST_IDS.auth.verificationPending} className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">
        {t('resendPrompt', { email })}
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full"
        disabled={loading}
        onClick={onResend}
        testId={TEST_IDS.auth.resendVerification}
      >
        {loading ? tCommon('waiting') : t('resendButton')}
      </Button>
    </div>
  );
}
