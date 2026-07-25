'use client';

import { useTranslations } from 'next-intl';
import { Container } from '@/components/layout/container';

export function SiteFooter() {
  const t = useTranslations('publicPages.footer');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background text-sm text-muted-foreground">
      <Container className="flex flex-col items-center justify-center py-6">
        <p className="text-center text-xs text-muted-foreground">{t('copyright', { year })}</p>
      </Container>
    </footer>
  );
}
