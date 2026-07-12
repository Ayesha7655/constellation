import { z } from 'zod';

type SellerUpgradeDetailsMessages = Readonly<{
  cityRequiresCountry: string;
}>;

export function createSellerUpgradeDetailsSchema(messages: SellerUpgradeDetailsMessages) {
  return z
    .object({
      companyName: z.preprocess(
        (val) => (typeof val === 'string' ? val : ''),
        z.string().trim().max(200).optional(),
      ),
      countryKey: z.preprocess(
        (val) => (typeof val === 'string' ? val : ''),
        z.string().trim(),
      ),
      cityKey: z.preprocess(
        (val) => (typeof val === 'string' ? val : ''),
        z.string().trim(),
      ),
    })
    .refine((data) => !data.cityKey || Boolean(data.countryKey), {
      message: messages.cityRequiresCountry,
      path: ['countryKey'],
    });
}

export type SellerUpgradeDetailsValues = z.infer<ReturnType<typeof createSellerUpgradeDetailsSchema>>;
