import { Container } from '@/components/layout/container';
import { SiteFooter } from '@/components/public-pages/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { ViewportShell } from '@/components/layout/viewport-shell';

type PublicPageProps = Readonly<{
  children: React.ReactNode;
}>;

export function PublicPage({ children }: PublicPageProps) {
  return (
    <ViewportShell header={<SiteHeader />} footer={<SiteFooter />} mainClassName="flex flex-col">
      {children}
    </ViewportShell>
  );
}

export function PublicPageContent({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <Container className={className}>{children}</Container>;
}
