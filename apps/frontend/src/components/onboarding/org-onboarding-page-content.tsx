import { getTranslations } from 'next-intl/server';
import { SiteHeader } from '@/components/layout/site-header';
import { ViewportShell } from '@/components/layout/viewport-shell';
import { OrgProfileForm } from '@/components/onboarding/org-profile-form';

export async function OrgOnboardingPageContent() {
  const t = await getTranslations('onboarding.org');

  return (
    <ViewportShell header={<SiteHeader />}>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <OrgProfileForm />
      </div>
    </ViewportShell>
  );
}
