import { ORG_DASHBOARD_ALLOWED_ROLES } from '@/lib/dashboard-allowed-account-types';
import { RoleDashboardLayout } from '@/components/layout/role-dashboard-layout';
import { orgDashboardNav } from '@/lib/dashboard-nav';

type DashboardRouteLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function DashboardRouteLayout({ children }: DashboardRouteLayoutProps) {
  return (
    <RoleDashboardLayout allowedRoleKeys={ORG_DASHBOARD_ALLOWED_ROLES} navConfig={orgDashboardNav}>
      {children}
    </RoleDashboardLayout>
  );
}
