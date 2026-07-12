import { Container } from '@/components/layout/container';
import { SiteHeader } from '@/components/layout/site-header';
import { ViewportShell } from '@/components/layout/viewport-shell';

type AuthPageProps = Readonly<{
  children: React.ReactNode;
  /** Vertically center short auth forms; disable for tall multi-step wizards (e.g. join). */
  centerContent?: boolean;
}>;

export function AuthPage({ children, centerContent = true }: AuthPageProps) {
  return (
    <ViewportShell header={<SiteHeader />} mainClassName="py-12">
      <Container className={centerContent ? 'flex min-h-[calc(100dvh-8rem)] flex-col justify-center' : undefined}>
        {children}
      </Container>
    </ViewportShell>
  );
}
