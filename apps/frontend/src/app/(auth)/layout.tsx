import { AuthRouteLayout } from '@/components/layout/auth-route-layout';

type AuthRouteLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function AuthRouteLayoutWrapper({ children }: AuthRouteLayoutProps) {
  return <AuthRouteLayout>{children}</AuthRouteLayout>;
}
