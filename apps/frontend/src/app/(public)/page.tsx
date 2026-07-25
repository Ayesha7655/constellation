import { Badge } from '@constellation/shared/ui';
import { getTranslations } from 'next-intl/server';
import { Briefcase, PenLine, Sparkles } from 'lucide-react';
import { PublicPageContent } from '@/components/layout/public-page';

export default async function HomePage() {
  const t = await getTranslations('home');

  const features = [
    { key: 'match', icon: Briefcase },
    { key: 'propose', icon: PenLine },
    { key: 'voice', icon: Sparkles },
  ] as const;

  return (
    <PublicPageContent className="py-16">
      <div className="flex flex-col gap-10">
        <div className="space-y-4">
          <Badge variant="default">{t('eyebrow')}</Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {t('title')}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{t('description')}</p>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          {features.map(({ key, icon: Icon }) => (
            <article key={key} className="rounded-xl bg-card p-6 shadow-sm">
              <div
                className="mb-4 flex size-10 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary"
                aria-hidden
              >
                <Icon className="size-5" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">{t(`features.${key}.title`)}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(`features.${key}.description`)}</p>
            </article>
          ))}
        </section>
      </div>
    </PublicPageContent>
  );
}
