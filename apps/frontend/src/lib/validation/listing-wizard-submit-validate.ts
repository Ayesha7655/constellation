import type { FormikErrors, FormikHelpers, FormikTouched } from 'formik';
import type { z } from 'zod';
import { buildStepValidationTouched, zodIssuesToFormikErrors } from '@/lib/validation/zod-formik-step-errors';

export type ListingWizardStepDef = Readonly<{
  schema: z.ZodType;
  fieldNames: readonly string[];
}>;

export async function validateListingWizardStepsForSubmit<T extends Record<string, unknown>>(
  steps: readonly ListingWizardStepDef[],
  values: T,
  setErrors: FormikHelpers<T>['setErrors'],
  setTouched: FormikHelpers<T>['setTouched'],
): Promise<{ ok: true } | { ok: false; stepIndex: number }> {
  for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
    const step = steps[stepIndex];
    if (!step) {
      continue;
    }
    const result = step.schema.safeParse(values);
    if (!result.success) {
      await setErrors(zodIssuesToFormikErrors(result.error.issues) as FormikErrors<T>);
      await setTouched(buildStepValidationTouched(step.fieldNames, result.error.issues) as FormikTouched<T>, false);
      return { ok: false, stepIndex };
    }
  }

  await setErrors({});
  return { ok: true };
}
