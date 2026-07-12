import { getTranslations } from 'next-intl/server';
import { PublicPageContent } from '@/components/layout/public-page';
import { Badge } from '@constellation/shared/ui';
import { api } from '@/lib/api';

export default async function HomePage() {
  const t = await getTranslations('home');
  let healthStatus: 'ok' | 'error' = 'error';

  try {
    const health = await api.health();
    healthStatus = health.status === 'ok' ? 'ok' : 'error';
  } catch {
    /* API may be unavailable during local setup */
  }

  const apiStatusLabel = healthStatus === 'ok' ? t('apiConnected') : t('apiOffline');

  return (
    <PublicPageContent className="py-16">
      <div className="flex flex-col gap-8">
        <div className="space-y-3">
          <Badge variant={healthStatus === 'ok' ? 'success' : 'muted'}>
            {t('apiBadge', { status: apiStatusLabel })}
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">{t('title')}</h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{t('description')}</p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-medium text-muted-foreground">{t('frontendLabel')}</h2>
            <p className="mt-2 text-2xl font-semibold text-card-foreground">{t('frontendTitle')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('frontendDescription')}</p>
          </article>
          <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-medium text-muted-foreground">{t('backendLabel')}</h2>
            <p className="mt-2 text-2xl font-semibold text-card-foreground">{t('backendTitle')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('backendDescription')}</p>
          </article>
        </section>
      </div>
    </PublicPageContent>
  );
}
