import { PublicPage } from '@/components/layout/public-page';

type PublicRouteLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function PublicRouteLayout({ children }: PublicRouteLayoutProps) {
  return <PublicPage>{children}</PublicPage>;
}
