'use client';

import type { ReactNode } from 'react';
import { DashboardGuardError } from '@/components/dashboard/dashboard-guard-error';
import { DashboardGuardLoading } from '@/components/dashboard/dashboard-guard-loading';
import { DashboardSessionProvider } from '@/contexts/dashboard-session-context';
import { useDashboardAuthGuard } from '@/hooks/use-dashboard-auth-guard';

type DashboardAuthGuardProps = Readonly<{
  allowedRoleKeys: readonly string[];
  children: ReactNode;
  skipOrgOnboardingGate?: boolean;
}>;

export function DashboardAuthGuard({
  allowedRoleKeys,
  children,
  skipOrgOnboardingGate,
}: DashboardAuthGuardProps) {
  const { state, user, onRetry } = useDashboardAuthGuard(allowedRoleKeys, { skipOrgOnboardingGate });

  if (state === 'loading') {
    return <DashboardGuardLoading />;
  }

  if (state === 'error') {
    return <DashboardGuardError onRetry={onRetry} />;
  }

  if (!user) {
    return null;
  }

  return <DashboardSessionProvider user={user}>{children}</DashboardSessionProvider>;
}
