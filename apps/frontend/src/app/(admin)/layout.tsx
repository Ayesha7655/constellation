import { SUPER_ADMIN_ALLOWED_ROLES } from '@/lib/dashboard-allowed-account-types';
import { RoleDashboardLayout } from '@/components/layout/role-dashboard-layout';
import { adminDashboardNav } from '@/lib/dashboard-nav';

type AdminRouteLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function AdminRouteLayout({ children }: AdminRouteLayoutProps) {
  return (
    <RoleDashboardLayout allowedRoleKeys={SUPER_ADMIN_ALLOWED_ROLES} navConfig={adminDashboardNav}>
      {children}
    </RoleDashboardLayout>
  );
}
