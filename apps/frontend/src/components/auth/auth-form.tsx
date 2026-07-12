'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AuthOAuthSection } from '@/components/auth/auth-oauth-section';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { AuthSwitchLink } from '@/components/auth/auth-switch-link';
import { SignInForm } from '@/components/auth/sign-in-form';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { VerificationResendSection } from '@/components/auth/verification-resend-section';
import { useAuthSubmit } from '@/hooks/use-auth-submit';

type AuthFormMode = 'sign-in' | 'sign-up';

export function AuthForm({ mode }: { mode: AuthFormMode }) {
  const t = useTranslations('auth');
  const auth = useAuthSubmit();
  const isSignUp = mode === 'sign-up';
  const verificationEmail = auth.messages.verificationEmail;

  const handleResendVerification = useCallback(() => {
    void auth.resendVerificationEmail(verificationEmail ?? '', mode);
  }, [auth, mode, verificationEmail]);

  const handleGoogleSignIn = useCallback(() => {
    auth.messages.clearMessages();
    void auth.signInWithGoogle();
  }, [auth]);

  return (
    <AuthPageShell
      title={isSignUp ? t('signUp.title') : t('signIn.title')}
      description={isSignUp ? t('signUp.description') : t('signIn.description')}
      error={auth.messages.error}
      info={auth.messages.info}
      footer={<AuthSwitchLink mode={mode} />}
    >
      <div className="space-y-4">
        {isSignUp ? <SignUpForm auth={auth} /> : <SignInForm auth={auth} />}
        {verificationEmail ? (
          <VerificationResendSection
            email={verificationEmail}
            loading={auth.loading}
            onResend={handleResendVerification}
          />
        ) : null}
        <AuthOAuthSection loading={auth.loading} onGoogleSignIn={handleGoogleSignIn} />
      </div>
    </AuthPageShell>
  );
}
