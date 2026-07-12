import { z } from 'zod';
import {
  requiredEmail,
  requiredPassword,
  requiredText,
} from '@/lib/validation/form-fields';

type ValidationMessages = Readonly<{
  emailRequired: string;
  invalidEmail: string;
  passwordRequired: string;
  passwordMin: string;
  passwordTooLong: string;
  nameRequired: string;
  nameTooShort: string;
  nameTooLong: string;
  confirmPasswordRequired: string;
  passwordNoMatch: string;
}>;

export function createSignInSchema(messages: ValidationMessages) {
  return z.object({
    email: requiredEmail(messages.emailRequired, messages.invalidEmail),
    password: requiredPassword({
      emptyMessage: messages.passwordRequired,
      minMessage: messages.passwordMin,
    }),
  });
}

export function createSignUpSchema(messages: ValidationMessages) {
  return z
    .object({
      name: z.preprocess(
        (val) => (typeof val === 'string' ? val : ''),
        z
          .string()
          .trim()
          .min(1, messages.nameRequired)
          .min(2, messages.nameTooShort)
          .max(120, messages.nameTooLong),
      ),
      email: requiredEmail(messages.emailRequired, messages.invalidEmail),
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

export type SignInValues = z.infer<ReturnType<typeof createSignInSchema>>;
export type SignUpValues = z.infer<ReturnType<typeof createSignUpSchema>>;
