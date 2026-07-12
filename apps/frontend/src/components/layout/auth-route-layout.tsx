'use client';

import { usePathname } from 'next/navigation';
import { AuthPage } from '@/components/layout/auth-page';

type AuthRouteLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

/** Join wizard is tall — vertical centering clips the step indicator; other auth pages stay centered. */
export function AuthRouteLayout({ children }: AuthRouteLayoutProps) {
  const pathname = usePathname();
  const centerContent = pathname !== '/join';

  return <AuthPage centerContent={centerContent}>{children}</AuthPage>;
}
