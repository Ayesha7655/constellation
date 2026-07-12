'use client';

import { useCallback, useMemo } from 'react';
import { Form, Formik, type FormikHelpers, type FormikProps } from 'formik';
import { useTranslations } from 'next-intl';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { FormikTextField } from '@/components/form/formik-text-field';
import { Button } from '@constellation/shared/ui';
import { TEST_IDS } from '@constellation/shared';
import type { AuthSubmitHandle } from '@/hooks/use-auth-submit';
import { useAuthValidationSchemas } from '@/hooks/use-auth-i18n';
import type { SignUpValues } from '@/lib/validation/auth-schemas';

const initialValues: SignUpValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

type SignUpFormProps = Readonly<{
  auth: AuthSubmitHandle;
}>;

export function SignUpForm({ auth }: SignUpFormProps) {
  const t = useTranslations('auth.signUp');
  const tFields = useTranslations('fields');
  const tCommon = useTranslations('common');
  const { signUpSchema } = useAuthValidationSchemas();
  const validationSchema = useMemo(() => toFormikValidationSchema(signUpSchema), [signUpSchema]);

  const handleSubmit = useCallback(
    async (values: SignUpValues, { setSubmitting }: FormikHelpers<SignUpValues>) => {
      auth.messages.clearMessages();
      await auth.signUpWithEmail({
        email: values.email,
        password: values.password,
        name: values.name,
      });
      setSubmitting(false);
    },
    [auth],
  );

  const renderForm = useCallback(
    ({ isSubmitting }: FormikProps<SignUpValues>) => (
      <Form className="space-y-4" noValidate>
        <FormikTextField
          name="name"
          label={tFields('name')}
          type="text"
          autoComplete="name"
          testId={TEST_IDS.signUp.name}
        />
        <FormikTextField
          name="email"
          label={tFields('email')}
          type="email"
          autoComplete="email"
          testId={TEST_IDS.signUp.email}
        />
        <FormikTextField
          name="password"
          label={tFields('password')}
          type="password"
          autoComplete="new-password"
          testId={TEST_IDS.signUp.password}
        />
        <FormikTextField
          name="confirmPassword"
          label={tFields('confirmPassword')}
          type="password"
          autoComplete="new-password"
          testId={TEST_IDS.signUp.confirmPassword}
        />
        <Button type="submit" testId={TEST_IDS.signUp.submit} disabled={auth.loading || isSubmitting}>
          {auth.loading || isSubmitting ? tCommon('waiting') : t('submitLabel')}
        </Button>
      </Form>
    ),
    [auth.loading, t, tCommon, tFields],
  );

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
      {renderForm}
    </Formik>
  );
}
