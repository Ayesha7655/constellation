'use client';

import { useCallback } from 'react';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@constellation/shared/ui';
import { TEST_IDS, resolveDashboardProfilePathFromHome } from '@constellation/shared';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuthRole } from '@/hooks/use-auth-role';
import { getDashboardHomePath } from '@/lib/auth-session';
import { clearClientAuthSession } from '@/lib/clear-client-auth';
import { logTechnicalError } from '@/lib/user-messages';
import { cn } from '@/lib/utils';
import { logout } from '@/services/auth-api';

const navLinkClassName = cn(
  'inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium',
  'transition-colors duration-200 ease-out',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
);

export function AuthNav() {
  const t = useTranslations('nav');
  const router = useRouter();
  const role = useAuthRole();
  const storedDashboardHref = getDashboardHomePath();
  const dashboardHref = storedDashboardHref ?? '/';
  const profileHref = storedDashboardHref
    ? resolveDashboardProfilePathFromHome(storedDashboardHref)
    : '/profile';

  const handleSignOut = useCallback(async () => {
    const { serverRevoked } = await logout();
    if (!serverRevoked) {
      logTechnicalError(
        'auth-nav sign-out',
        'Server could not revoke session; local session cleared',
      );
    }
    await clearClientAuthSession();
    router.replace('/');
  }, [router]);

  const onSignOutClick = useCallback(() => {
    void handleSignOut();
  }, [handleSignOut]);

  if (!role) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/sign-in"
          data-testid={TEST_IDS.nav.signIn}
          className={cn(navLinkClassName, 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground')}
        >
          {t('signIn')}
        </Link>
        <Link
          href="/sign-up"
          data-testid={TEST_IDS.nav.signUp}
          className={cn(navLinkClassName, 'bg-primary text-primary-foreground hover:bg-primary-hover')}
        >
          {t('signUp')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={dashboardHref}
        data-testid={TEST_IDS.nav.dashboard}
        className={cn(navLinkClassName, 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground')}
      >
        {t('dashboard')}
      </Link>
      <Link
        href={profileHref}
        data-testid={TEST_IDS.nav.profile}
        className={cn(navLinkClassName, 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground')}
      >
        {t('profile')}
      </Link>
      <Button
        type="button"
        variant="outline"
        onClick={onSignOutClick}
        testId={TEST_IDS.nav.signOut}
        fullWidth={false}
        className="px-3 py-1.5"
      >
        <LogOut className="size-4 shrink-0" aria-hidden />
        {t('signOut')}
      </Button>
    </div>
  );
}
