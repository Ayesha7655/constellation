import { z } from 'zod';
import { requiredPassword, requiredText } from '@/lib/validation/form-fields';

type ProfileValidationMessages = Readonly<{
  nameRequired: string;
  nameTooLong: string;
}>;

type ChangePasswordValidationMessages = Readonly<{
  currentPasswordRequired: string;
  passwordRequired: string;
  passwordMin: string;
  passwordTooLong: string;
  confirmPasswordRequired: string;
  passwordNoMatch: string;
  passwordSameAsCurrent: string;
}>;

export function createProfileSchema(messages: ProfileValidationMessages) {
  return z.object({
    name: requiredText(messages.nameRequired).pipe(z.string().max(120, messages.nameTooLong)),
  });
}

export function createChangePasswordSchema(messages: ChangePasswordValidationMessages) {
  return z
    .object({
      currentPassword: requiredText(messages.currentPasswordRequired),
      newPassword: requiredPassword({
        maxLength: 128,
        emptyMessage: messages.passwordRequired,
        minMessage: messages.passwordMin,
        maxMessage: messages.passwordTooLong,
      }),
      confirmPassword: requiredText(messages.confirmPasswordRequired),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: messages.passwordNoMatch,
      path: ['confirmPassword'],
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
      message: messages.passwordSameAsCurrent,
      path: ['newPassword'],
    });
}

export type ProfileFormValues = z.infer<ReturnType<typeof createProfileSchema>>;
export type ChangePasswordFormValues = z.infer<ReturnType<typeof createChangePasswordSchema>>;
