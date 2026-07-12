import type { ListingWizardStepDef } from '@/lib/validation/listing-wizard-submit-validate';

/**
 * Derived per-step completeness for the listing wizard. Completeness is computed against the
 * **current** step schemas on every resume — never read from storage — so a draft saved before a
 * step/field changed is reconciled against today's wizard. Pure (no Formik/side effects); shared by
 * the seller wizard now and the partner wizard (Epic 5).
 */

/** One `safeParse` per step → completeness flag per step (index-aligned with `steps`). */
export function computeListingWizardStepCompleteness(
  steps: readonly Pick<ListingWizardStepDef, 'schema'>[],
  values: Record<string, unknown>,
): boolean[] {
  return steps.map((step) => step.schema.safeParse(values).success);
}

/** Index of the first incomplete step, or -1 when every step is complete. */
export function firstIncompleteStepIndex(completeness: readonly boolean[]): number {
  return completeness.findIndex((complete) => !complete);
}

/**
 * Landing step on resume = `min(position(resumeStepId), position(firstIncompleteStep))` — never place
 * the user *past* an unfilled mandatory step. `resumeStepId` is a hint only; when it is unknown
 * (`resumeIndex < 0`) the rule falls through to the first incomplete step (or the last step if all
 * steps are complete).
 */
export function resolveResumeLandingIndex(args: {
  resumeIndex: number;
  completeness: readonly boolean[];
}): number {
  const { resumeIndex, completeness } = args;
  const lastIndex = Math.max(0, completeness.length - 1);
  const incomplete = firstIncompleteStepIndex(completeness);
  const validResume = resumeIndex >= 0 ? resumeIndex : null;

  if (incomplete < 0) {
    return validResume ?? lastIndex;
  }
  if (validResume === null) {
    return incomplete;
  }
  return Math.min(validResume, incomplete);
}
