'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';
import { createForgotPasswordSchema, createResetPasswordSchema } from '@/lib/validation/password-reset-schemas';
import { createSignInSchema, createSignUpSchema } from '@/lib/validation/auth-schemas';

export function useValidationMessages() {
  const t = useTranslations('validation');

  return useMemo(
    () => ({
      emailRequired: t('emailRequired'),
      invalidEmail: t('invalidEmail'),
      passwordRequired: t('passwordRequired'),
      passwordMin: t('passwordMin'),
      passwordTooLong: t('passwordTooLong'),
      nameRequired: t('nameRequired'),
      nameTooShort: t('nameTooShort'),
      nameTooLong: t('nameTooLong'),
      confirmPasswordRequired: t('confirmPasswordRequired'),
      passwordNoMatch: t('passwordNoMatch'),
      cityRequiresCountry: t('cityRequiresCountry'),
    }),
    [t],
  );
}

export function useAuthValidationSchemas() {
  const messages = useValidationMessages();

  return useMemo(
    () => ({
      signInSchema: createSignInSchema(messages),
      signUpSchema: createSignUpSchema(messages),
      forgotPasswordSchema: createForgotPasswordSchema(messages),
      resetPasswordSchema: createResetPasswordSchema(messages),
    }),
    [messages],
  );
}

export function useAuthErrorTranslator() {
  const t = useTranslations();

  return useCallback((key: string) => t(key as never), [t]);
}

export function useLocaleDirection(): 'ltr' | 'rtl' {
  const locale = useLocale();
  return locale === 'ar' ? 'rtl' : 'ltr';
}
