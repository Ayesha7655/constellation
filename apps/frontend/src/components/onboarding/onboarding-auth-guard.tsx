'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { DashboardGuardError } from '@/components/dashboard/dashboard-guard-error';
import { DashboardGuardLoading } from '@/components/dashboard/dashboard-guard-loading';
import { ORG_DASHBOARD_ALLOWED_ROLES } from '@/lib/dashboard-allowed-account-types';
import { DASHBOARD_BASE_PATH } from '@/lib/roles';
import { useDashboardAuthGuard } from '@/hooks/use-dashboard-auth-guard';

type OnboardingAuthGuardProps = Readonly<{
  children: React.ReactNode;
}>;

export function OnboardingAuthGuard({ children }: OnboardingAuthGuardProps) {
  const router = useRouter();
  const { state, user, onRetry } = useDashboardAuthGuard(ORG_DASHBOARD_ALLOWED_ROLES, {
    skipOrgOnboardingGate: true,
  });

  useEffect(() => {
    if (state === 'authorized' && user?.orgProfileComplete) {
      router.replace(user.dashboardHomePath || DASHBOARD_BASE_PATH.org);
    }
  }, [router, state, user]);

  if (state === 'loading') {
    return <DashboardGuardLoading />;
  }

  if (state === 'error') {
    return <DashboardGuardError onRetry={onRetry} />;
  }

  if (!user || user.orgProfileComplete) {
    return null;
  }

  return children;
}
