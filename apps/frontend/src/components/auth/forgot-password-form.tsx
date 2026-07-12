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
import type { ForgotPasswordValues } from '@/lib/validation/password-reset-schemas';
import { requestPasswordReset } from '@/services/auth-api';

const initialValues: ForgotPasswordValues = { email: '' };

type ForgotPasswordFormProps = Readonly<{
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  clearMessages: () => void;
}>;

export function ForgotPasswordForm({
  onSuccess,
  onError,
  clearMessages,
}: ForgotPasswordFormProps) {
  const t = useTranslations('auth.forgotPassword');
  const tFields = useTranslations('fields');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations();
  const { forgotPasswordSchema } = useAuthValidationSchemas();
  const validationSchema = useMemo(
    () => toFormikValidationSchema(forgotPasswordSchema),
    [forgotPasswordSchema],
  );

  const handleSubmit = useCallback(async (
    values: ForgotPasswordValues,
    { setSubmitting }: FormikHelpers<ForgotPasswordValues>,
  ) => {
      clearMessages();
      try {
        const result = await requestPasswordReset(values.email);
        const message = translateAuthCode(result.code, (key) => tErrors(key as never));
        showAuthSuccess(message);
        onSuccess(message);
      } catch (err) {
        showAuthError(err, (key) => tErrors(key as never));
        onError(translateAuthRequestError(err, (key) => tErrors(key as never)));
      } finally {
        setSubmitting(false);
      }
  }, [clearMessages, onError, onSuccess, tErrors]);

  const renderForm = useCallback(({ isSubmitting }: FormikProps<ForgotPasswordValues>) => (
      <Form className="space-y-4" noValidate>
        <FormikTextField
          name="email"
          label={tFields('email')}
          type="email"
          autoComplete="email"
          testId={TEST_IDS.forgotPassword.email}
        />
        <Button type="submit" testId={TEST_IDS.forgotPassword.submit} disabled={isSubmitting}>
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
