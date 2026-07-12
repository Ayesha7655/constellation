'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

type AuthSwitchLinkProps = Readonly<{
  mode: 'sign-in' | 'sign-up';
}>;

export function AuthSwitchLink({ mode }: AuthSwitchLinkProps) {
  const t = useTranslations('auth');
  const isSignUp = mode === 'sign-up';

  return (
    <p className="text-center text-sm text-muted-foreground">
      {isSignUp ? (
        <>
          {t('signInSwitch.prompt')}{' '}
          <Link href="/sign-in" className="font-medium text-foreground hover:underline">
            {t('signInSwitch.link')}
          </Link>
        </>
      ) : (
        <>
          {t('signUp.switchPrompt')}{' '}
          <Link href="/sign-up" className="font-medium text-foreground hover:underline">
            {t('signUp.switchLink')}
          </Link>
        </>
      )}
    </p>
  );
}
