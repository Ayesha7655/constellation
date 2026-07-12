'use client';

import { useCallback, useMemo } from 'react';
import { Form, Formik, type FormikHelpers, type FormikProps } from 'formik';
import { useTranslations } from 'next-intl';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { FormikTextField } from '@/components/form/formik-text-field';
import { Button } from '@constellation/shared/ui';
import { TEST_IDS } from '@constellation/shared';
import { useAuthValidationSchemas } from '@/hooks/use-auth-i18n';
import { showAuthError, showAuthSuccess } from '@/components/auth/auth-toast';
import { translateAuthCode } from '@/lib/translate-auth-code';
import { translateAuthRequestError } from '@/lib/user-messages';
import type { ResetPasswordValues } from '@/lib/validation/password-reset-schemas';
import { resetPassword } from '@/services/auth-api';

const initialValues: ResetPasswordValues = {
  password: '',
  confirmPassword: '',
};

type ResetPasswordFormProps = Readonly<{
  oobCode: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  clearMessages: () => void;
}>;

export function ResetPasswordForm({
  oobCode,
  onSuccess,
  onError,
  clearMessages,
}: ResetPasswordFormProps) {
  const t = useTranslations('auth.resetPassword');
  const tFields = useTranslations('fields');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations();
  const { resetPasswordSchema } = useAuthValidationSchemas();
  const validationSchema = useMemo(
    () => toFormikValidationSchema(resetPasswordSchema),
    [resetPasswordSchema],
  );

  const handleSubmit = useCallback(async (
    values: ResetPasswordValues,
    { setSubmitting }: FormikHelpers<ResetPasswordValues>,
  ) => {
      clearMessages();
      try {
        const result = await resetPassword({
          oobCode,
          password: values.password,
        });
        const message = translateAuthCode(result.code, (key) => tErrors(key as never));
        showAuthSuccess(message);
        onSuccess(message);
      } catch (err) {
        showAuthError(err, (key) => tErrors(key as never));
        onError(translateAuthRequestError(err, (key) => tErrors(key as never)));
      } finally {
        setSubmitting(false);
      }
  }, [clearMessages, oobCode, onError, onSuccess, tErrors]);

  const renderForm = useCallback(({ isSubmitting }: FormikProps<ResetPasswordValues>) => (
      <Form className="space-y-4" noValidate>
        <FormikTextField
          name="password"
          label={tFields('newPassword')}
          type="password"
          autoComplete="new-password"
          testId={TEST_IDS.resetPassword.password}
        />
        <FormikTextField
          name="confirmPassword"
          label={tFields('confirmPassword')}
          type="password"
          autoComplete="new-password"
          testId={TEST_IDS.resetPassword.confirmPassword}
        />
        <Button type="submit" testId={TEST_IDS.resetPassword.submit} disabled={isSubmitting}>
          {isSubmitting ? tCommon('waiting') : t('submitLabel')}
        </Button>
      </Form>
  ), [t, tCommon, tFields]);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {renderForm}
    </Formik>
  );
}
