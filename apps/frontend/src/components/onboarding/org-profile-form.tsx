'use client';

import { useCallback, useMemo } from 'react';
import { Form, Formik, type FormikHelpers, type FormikProps } from 'formik';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { Button, FormActions } from '@constellation/shared/ui';
import { TEST_IDS } from '@constellation/shared';
import { FormikTextField } from '@/components/form/formik-text-field';
import { FormikTextareaField } from '@/components/form/formik-textarea-field';
import { DASHBOARD_BASE_PATH } from '@/lib/roles';
import { createOrgProfileSchema, type OrgProfileValues } from '@/lib/validation/org-profile-schemas';
import { showUserErrorToast, showUserSuccessToast } from '@/i18n/translate-user-message';
import { translateAuthRequestError } from '@/lib/user-messages';
import { updateOrganizationProfile } from '@/services/organizations-api';
import { getCurrentUser } from '@/services/auth-api';

const emptyValues: OrgProfileValues = { name: '', address: '' };

export function OrgProfileForm() {
  const t = useTranslations('onboarding.org');
  const tFields = useTranslations('fields');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations();
  const router = useRouter();

  const validationSchema = useMemo(
    () =>
      toFormikValidationSchema(
        createOrgProfileSchema({
          nameRequired: t('validation.nameRequired'),
          addressRequired: t('validation.addressRequired'),
          nameTooLong: t('validation.nameTooLong'),
          addressTooLong: t('validation.addressTooLong'),
        }),
      ),
    [t],
  );

  const handleSubmit = useCallback(
    async (values: OrgProfileValues, { setSubmitting }: FormikHelpers<OrgProfileValues>) => {
      try {
        await updateOrganizationProfile({
          name: values.name.trim(),
          address: values.address.trim(),
        });
        showUserSuccessToast(t('success'));
        const user = await getCurrentUser();
        router.replace(user.dashboardHomePath || DASHBOARD_BASE_PATH.org);
        router.refresh();
      } catch (error: unknown) {
        showUserErrorToast(translateAuthRequestError(error, tErrors));
      } finally {
        setSubmitting(false);
      }
    },
    [router, t, tErrors],
  );

  const renderForm = useCallback(
    ({ isSubmitting }: FormikProps<OrgProfileValues>) => (
      <Form className="space-y-4" noValidate>
        <FormikTextField
          name="name"
          label={tFields('orgName')}
          testId={TEST_IDS.onboardingOrg.name}
        />
        <FormikTextareaField
          name="address"
          label={tFields('orgAddress')}
          testId={TEST_IDS.onboardingOrg.address}
        />
        <FormActions className="justify-end">
          <Button type="submit" testId={TEST_IDS.onboardingOrg.submit} disabled={isSubmitting}>
            {isSubmitting ? tCommon('waiting') : t('submitLabel')}
          </Button>
        </FormActions>
      </Form>
    ),
    [t, tCommon, tFields],
  );

  return (
    <Formik initialValues={emptyValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
      {renderForm}
    </Formik>
  );
}
