import { z } from 'zod';
import { requiredText } from '@/lib/validation/form-fields';

type OrgProfileValidationMessages = Readonly<{
  nameRequired: string;
  addressRequired: string;
  nameTooLong: string;
  addressTooLong: string;
}>;

export function createOrgProfileSchema(messages: OrgProfileValidationMessages) {
  return z.object({
    name: requiredText(messages.nameRequired).pipe(z.string().trim().max(200, messages.nameTooLong)),
    address: requiredText(messages.addressRequired).pipe(z.string().trim().max(500, messages.addressTooLong)),
  });
}

export type OrgProfileValues = z.infer<ReturnType<typeof createOrgProfileSchema>>;
