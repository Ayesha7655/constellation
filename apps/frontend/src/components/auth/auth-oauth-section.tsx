'use client';

import { useTranslations } from 'next-intl';
import { Button, FormDivider, GoogleIcon } from '@constellation/shared/ui';
import { TEST_IDS } from '@constellation/shared';

type AuthOAuthSectionProps = Readonly<{
  loading: boolean;
  onGoogleSignIn: () => void;
  /** When true, Google button appears before the divider (join step 1). */
  leading?: boolean;
}>;

export function AuthOAuthSection({
  loading,
  onGoogleSignIn,
  leading = false,
}: AuthOAuthSectionProps) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');

  const googleButton = (
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      onClick={onGoogleSignIn}
      testId={TEST_IDS.auth.google}
      className="inline-flex items-center justify-center gap-2"
    >
      <GoogleIcon />
      {t('google')}
    </Button>
  );

  if (leading) {
    return (
      <>
        {googleButton}
        <FormDivider label={tCommon('or')} />
      </>
    );
  }

  return (
    <>
      <FormDivider label={tCommon('or')} />
      {googleButton}
    </>
  );
}
