import { getTranslations } from 'next-intl/server';
import { UnderConstruction } from '@constellation/shared/ui';

type DashboardPlaceholderPageProps = Readonly<{
  titleKey: string;
  descriptionKey: string;
}>;

export async function DashboardPlaceholderPage({ titleKey, descriptionKey }: DashboardPlaceholderPageProps) {
  const t = await getTranslations('dashboard');

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <UnderConstruction label={t('underConstruction')} />
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">{t(titleKey)}</h2>
      <p className="text-muted-foreground">{t(descriptionKey)}</p>
    </div>
  );
}
