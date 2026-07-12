'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import { Form, Formik, type FormikHelpers } from 'formik';
import { useTranslations } from 'next-intl';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { Button, FormActions, StatusBadge } from '@constellation/shared/ui';
import { TEST_IDS } from '@constellation/shared';
import { FormikTextField } from '@/components/form/formik-text-field';
import { useDashboardSession } from '@/contexts/dashboard-session-context';
import { authProviderBadgeVariant, roleStatusBadgeVariant } from '@/lib/profile-badge-variants';
import { createProfileSchema, type ProfileFormValues } from '@/lib/validation/profile-schemas';
import { showProfileError, showProfileSuccess } from '@/components/profile/profile-toast';
import { getMySessions, updateMyProfile, type AuthProvider } from '@/services/auth-api';
import { ChangePasswordDialog } from './change-password-dialog';
import { ManageSessionsSidePanel } from './manage-sessions-side-panel';
import { ProfilePreferencesSection } from './profile-preferences-section';
import { ProfileSignOutButton } from './profile-sign-out-button';

function ReadOnlyField({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        {value}
      </span>
    </div>
  );
}

function AccountBadges({
  primaryRole,
  roleCode,
  roles,
  authProvider,
  authProviderLabel,
  rolesLabel,
  authProviderFieldLabel,
}: Readonly<{
  primaryRole: string;
  roleCode: string;
  roles: readonly string[];
  authProvider: AuthProvider;
  authProviderLabel: string;
  rolesLabel: string;
  authProviderFieldLabel: string;
}>) {
  const otherRoles = roles.filter((role) => role !== primaryRole);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-8">
      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-sm font-medium text-foreground">{rolesLabel}</span>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={primaryRole} variant={roleStatusBadgeVariant(roleCode)} />
          {otherRoles.map((role) => (
            <StatusBadge key={role} label={role} variant="secondary" />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-sm font-medium text-foreground">{authProviderFieldLabel}</span>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={authProviderLabel} variant={authProviderBadgeVariant(authProvider)} />
        </div>
      </div>
    </div>
  );
}

export function ProfileSettingsForm() {
  const user = useDashboardSession();
  const t = useTranslations('dashboard.profile');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations();
  const formId = useId();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);

  const isPasswordAccount = user.authProvider === 'PASSWORD';

  const validationSchema = useMemo(
    () =>
      toFormikValidationSchema(
        createProfileSchema({
          nameRequired: t('validation.nameRequired'),
          nameTooLong: t('validation.nameTooLong'),
        }),
      ),
    [t],
  );

  const initialValues = useMemo(
    (): ProfileFormValues => ({
      name: user.name,
    }),
    [user.name],
  );

  const providerLabel = useCallback(
    (provider: AuthProvider): string =>
      provider === 'GOOGLE' ? t('providers.google') : provider === 'APPLE' ? t('providers.apple') : t('providers.password'),
    [t],
  );

  const handleSubmit = useCallback(
    async (values: ProfileFormValues, { setSubmitting }: FormikHelpers<ProfileFormValues>) => {
      try {
        await updateMyProfile({ name: values.name.trim() });
        window.dispatchEvent(new Event('constellation:auth-session-change'));
        showProfileSuccess(t('saved'));
      } catch (error) {
        showProfileError(error, (key) => tErrors(key as never));
      } finally {
        setSubmitting(false);
      }
    },
    [t, tErrors],
  );

  const openChangePassword = useCallback(() => setChangePasswordOpen(true), []);
  const openSessions = useCallback(() => setSessionsOpen(true), []);
  const onPasswordChanged = useCallback(async () => {
    try {
      const { sessions } = await getMySessions();
      if (sessions.some((session) => !session.isCurrent)) {
        setSessionsOpen(true);
      }
    } catch {
      /* Password already changed */
    }
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {(formik) => (
          <Form id={formId} className="flex flex-col gap-4" noValidate>
            <FormikTextField name="name" label={t('fields.name')} autoComplete="name" />
            <ReadOnlyField label={t('fields.email')} value={user.email} />
            {user.orgName ? <ReadOnlyField label={t('fields.organization')} value={user.orgName} /> : null}
            {user.orgAddress ? <ReadOnlyField label={t('fields.orgAddress')} value={user.orgAddress} /> : null}
            <AccountBadges
              primaryRole={user.role}
              roleCode={user.roleCode}
              roles={user.roles}
              authProvider={user.authProvider}
              authProviderLabel={providerLabel(user.authProvider)}
              rolesLabel={t('fields.roles')}
              authProviderFieldLabel={t('fields.authProvider')}
            />

            <FormActions className="justify-end">
              <Button type="submit" fullWidth={false} disabled={formik.isSubmitting} testId={TEST_IDS.profileSettings.submit}>
                {formik.isSubmitting ? tCommon('waiting') : t('save')}
              </Button>
            </FormActions>
          </Form>
        )}
      </Formik>

      <ProfilePreferencesSection />

      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">{t('security.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('security.subtitle')}</p>
        </div>

        {isPasswordAccount ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium text-foreground">{t('password.title')}</span>
              <p className="text-sm text-muted-foreground">{t('password.description')}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              fullWidth={false}
              className="shrink-0"
              onClick={openChangePassword}
              testId={TEST_IDS.profileSettings.changePassword}
            >
              {t('password.openButton')}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('password.oauthNote', { provider: providerLabel(user.authProvider) })}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-sm font-medium text-foreground">{t('sessions.title')}</span>
            <p className="text-sm text-muted-foreground">{t('sessions.description')}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            fullWidth={false}
            className="shrink-0"
            onClick={openSessions}
            testId={TEST_IDS.profileSettings.manageSessions}
          >
            {t('sessions.openButton')}
          </Button>
        </div>

        <div className="border-t border-border pt-4">
          <ProfileSignOutButton />
        </div>
      </div>

      {isPasswordAccount ? (
        <ChangePasswordDialog
          open={changePasswordOpen}
          onOpenChange={setChangePasswordOpen}
          onPasswordChanged={onPasswordChanged}
        />
      ) : null}
      <ManageSessionsSidePanel open={sessionsOpen} onOpenChange={setSessionsOpen} />
    </div>
  );
}
