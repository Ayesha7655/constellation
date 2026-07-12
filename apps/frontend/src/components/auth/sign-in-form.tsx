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
import { Link } from '@/i18n/navigation';
import type { SignInValues } from '@/lib/validation/auth-schemas';

const initialValues: SignInValues = { email: '', password: '' };

type SignInFormProps = Readonly<{
  auth: AuthSubmitHandle;
}>;

export function SignInForm({ auth }: SignInFormProps) {
  const t = useTranslations('auth.signIn');
  const tFields = useTranslations('fields');
  const tCommon = useTranslations('common');
  const { signInSchema } = useAuthValidationSchemas();
  const validationSchema = useMemo(() => toFormikValidationSchema(signInSchema), [signInSchema]);

  const handleSubmit = useCallback(async (values: SignInValues, { setSubmitting }: FormikHelpers<SignInValues>) => {
    auth.messages.clearMessages();
    await auth.signInWithEmail(values.email, values.password);
    setSubmitting(false);
  }, [auth]);

  const renderForm = useCallback(({ isSubmitting }: FormikProps<SignInValues>) => (
      <Form className="space-y-4" noValidate>
        <FormikTextField
          name="email"
          label={tFields('email')}
          type="email"
          autoComplete="email"
          testId={TEST_IDS.signIn.email}
        />
        <div className="space-y-1">
          <FormikTextField
            name="password"
            label={tFields('password')}
            type="password"
            autoComplete="current-password"
            testId={TEST_IDS.signIn.password}
          />
          <p className="text-end text-sm">
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              {t('forgotPassword')}
            </Link>
          </p>
        </div>
        <Button type="submit" testId={TEST_IDS.signIn.submit} disabled={auth.loading || isSubmitting}>
          {auth.loading || isSubmitting ? tCommon('waiting') : t('submitLabel')}
        </Button>
      </Form>
  ), [auth.loading, t, tCommon, tFields]);

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
