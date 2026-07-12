import { z } from 'zod';
import { requiredEmail, requiredPassword, requiredText } from '@/lib/validation/form-fields';

type PasswordResetValidationMessages = Readonly<{
  emailRequired: string;
  invalidEmail: string;
  passwordRequired: string;
  passwordMin: string;
  passwordTooLong: string;
  confirmPasswordRequired: string;
  passwordNoMatch: string;
}>;

export function createForgotPasswordSchema(messages: PasswordResetValidationMessages) {
  return z.object({
    email: requiredEmail(messages.emailRequired, messages.invalidEmail),
  });
}

export function createResetPasswordSchema(messages: PasswordResetValidationMessages) {
  return z
    .object({
      password: requiredPassword({
        maxLength: 128,
        emptyMessage: messages.passwordRequired,
        minMessage: messages.passwordMin,
        maxMessage: messages.passwordTooLong,
      }),
      confirmPassword: requiredText(messages.confirmPasswordRequired),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordNoMatch,
      path: ['confirmPassword'],
    });
}

export type ForgotPasswordValues = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
export type ResetPasswordValues = z.infer<ReturnType<typeof createResetPasswordSchema>>;
