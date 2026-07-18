'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { AuthNav } from '@/components/auth/auth-nav';
import { BrandLink } from '@/components/layout/brand-link';
import { Container } from '@/components/layout/container';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function SiteHeader() {
  const t = useTranslations('nav');

  return (
    <header className="border-b border-border bg-background">
      <Container className="flex h-14 items-center justify-between">
        <BrandLink />
        <nav className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            {t('home')}
          </Link>
          <AuthNav />
          <LocaleSwitcher />
          <ThemeToggle />
        </nav>
      </Container>
    </header>
  );
}
