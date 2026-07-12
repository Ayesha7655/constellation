'use client';

import { useCallback, useId, useMemo } from 'react';
import { Form, Formik, type FormikHelpers } from 'formik';
import { useTranslations } from 'next-intl';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { Button, Dialog, FormActions } from '@constellation/shared/ui';
import { TEST_IDS } from '@constellation/shared';
import { FormikTextField } from '@/components/form/formik-text-field';
import { createChangePasswordSchema, type ChangePasswordFormValues } from '@/lib/validation/profile-schemas';
import { translateAuthCode } from '@/lib/translate-auth-code';
import { showProfileError, showProfileSuccess } from '@/components/profile/profile-toast';
import { changeMyPassword } from '@/services/auth-api';

type ChangePasswordDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordChanged: () => void;
}>;

const initialValues: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function ChangePasswordDialog({ open, onOpenChange, onPasswordChanged }: ChangePasswordDialogProps) {
  const t = useTranslations('dashboard.profile.password');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations();
  const formId = useId();

  const validationSchema = useMemo(
    () =>
      toFormikValidationSchema(
        createChangePasswordSchema({
          currentPasswordRequired: t('validation.currentRequired'),
          passwordRequired: t('validation.newRequired'),
          passwordMin: t('validation.min'),
          passwordTooLong: t('validation.tooLong'),
          confirmPasswordRequired: t('validation.confirmRequired'),
          passwordNoMatch: t('validation.noMatch'),
          passwordSameAsCurrent: t('validation.sameAsCurrent'),
        }),
      ),
    [t],
  );

  const onCancel = useCallback(() => onOpenChange(false), [onOpenChange]);

  const handleSubmit = useCallback(
    async (values: ChangePasswordFormValues, { setSubmitting }: FormikHelpers<ChangePasswordFormValues>) => {
      try {
        const result = await changeMyPassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
        onOpenChange(false);
        showProfileSuccess(translateAuthCode(result.code, (key) => tErrors(key as never)));
        onPasswordChanged();
      } catch (error) {
        showProfileError(error, (key) => tErrors(key as never));
      } finally {
        setSubmitting(false);
      }
    },
    [onOpenChange, onPasswordChanged, tErrors],
  );

  if (!open) {
    return null;
  }

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
      {(formik) => (
        <Dialog
          open={open}
          onOpenChange={onOpenChange}
          title={t('title')}
          description={t('description')}
          size="md"
          testId={TEST_IDS.changePassword.dialog}
          footer={
            <FormActions>
              <Button type="button" variant="outline" fullWidth={false} onClick={onCancel} testId={TEST_IDS.changePassword.cancel}>
                {tCommon('cancel')}
              </Button>
              <Button type="submit" form={formId} fullWidth={false} disabled={formik.isSubmitting} testId={TEST_IDS.changePassword.submit}>
                {formik.isSubmitting ? tCommon('waiting') : t('submit')}
              </Button>
            </FormActions>
          }
        >
          <Form id={formId} className="flex flex-col gap-4" noValidate>            <FormikTextField
              name="currentPassword"
              label={t('currentPassword')}
              type="password"
              autoComplete="current-password"
            />
            <FormikTextField name="newPassword" label={t('newPassword')} type="password" autoComplete="new-password" />
            <FormikTextField
              name="confirmPassword"
              label={t('confirmPassword')}
              type="password"
              autoComplete="new-password"
            />
          </Form>
        </Dialog>
      )}
    </Formik>
  );
}
