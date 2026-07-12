'use client';

import { useCallback } from 'react';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@constellation/shared/ui';
import { TEST_IDS } from '@constellation/shared';
import { clearClientAuthSession } from '@/lib/clear-client-auth';
import { logTechnicalError } from '@/lib/user-messages';
import { cn } from '@/lib/utils';
import { logout } from '@/services/auth-api';

export function ProfileSignOutButton() {
  const tNav = useTranslations('nav');
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    const { serverRevoked } = await logout();
    if (!serverRevoked) {
      logTechnicalError(
        'profile-sign-out',
        'Server could not revoke session; local session cleared',
      );
    }
    await clearClientAuthSession();
    router.replace('/');
  }, [router]);

  const onSignOutClick = useCallback(() => {
    void handleSignOut();
  }, [handleSignOut]);

  return (
    <Button
      type="button"
      variant="outline"
      fullWidth={false}
      onClick={onSignOutClick}
      testId={TEST_IDS.nav.signOut}
      className={cn('inline-flex w-fit items-center gap-2 self-start')}
    >
      <LogOut className="size-4" aria-hidden />
      {tNav('signOut')}
    </Button>
  );
}
