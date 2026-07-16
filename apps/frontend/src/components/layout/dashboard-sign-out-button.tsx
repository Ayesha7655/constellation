'use client';

import { useCallback } from 'react';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TEST_IDS } from '@constellation/shared';
import { useRouter } from '@/i18n/navigation';
import { clearClientAuthSession } from '@/lib/clear-client-auth';
import { logTechnicalError } from '@/lib/user-messages';
import { cn } from '@/lib/utils';
import { logout } from '@/services/auth-api';

type DashboardSignOutButtonProps = Readonly<{
  onNavigate?: () => void;
}>;

export function DashboardSignOutButton({ onNavigate }: DashboardSignOutButtonProps) {
  const tNav = useTranslations('nav');
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    onNavigate?.();
    const { serverRevoked } = await logout();
    if (!serverRevoked) {
      logTechnicalError(
        'dashboard-sign-out',
        'Server could not revoke session; local session cleared',
      );
    }
    await clearClientAuthSession();
    router.replace('/');
  }, [onNavigate, router]);

  const onSignOutClick = useCallback(() => {
    void handleSignOut();
  }, [handleSignOut]);

  return (
    <button
      type="button"
      onClick={onSignOutClick}
      data-testid={TEST_IDS.dashboardNav.signOut}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
        'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <LogOut className="size-4 shrink-0 text-primary/70" aria-hidden />
      <span>{tNav('signOut')}</span>
    </button>
  );
}
