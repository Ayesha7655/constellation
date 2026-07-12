'use client';

import type { ReactNode } from 'react';
import type { DashboardNavConfig } from '@/lib/dashboard-nav';
import { DashboardAuthGuard } from '@/components/dashboard/dashboard-auth-guard';
import { DashboardShell } from '@/components/layout/dashboard-shell';

type RoleDashboardLayoutProps = Readonly<{
  allowedRoleKeys: readonly string[];
  navConfig: DashboardNavConfig;
  children: ReactNode;
  skipOrgOnboardingGate?: boolean;
}>;

export function RoleDashboardLayout({
  allowedRoleKeys,
  navConfig,
  children,
  skipOrgOnboardingGate,
}: RoleDashboardLayoutProps) {
  return (
    <DashboardAuthGuard allowedRoleKeys={allowedRoleKeys} skipOrgOnboardingGate={skipOrgOnboardingGate}>
      <DashboardShell config={navConfig}>{children}</DashboardShell>
    </DashboardAuthGuard>
  );
}
