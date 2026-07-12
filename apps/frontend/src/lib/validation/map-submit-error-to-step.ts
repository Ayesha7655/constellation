import { lookupMessageKey } from '@/i18n/translate-user-message';
import { AuthRequestError } from '@/lib/user-messages';

/**
 * Map a strict-submit failure to the wizard step that owns the offending field, so the user lands on
 * the offending step with the error inline instead of an opaque toast about a field that is not on
 * the current screen. Covers two drift shapes that the client step schemas can pass but the server
 * rejects: a now-inactive/soft-deleted catalog key, or a field the backend requires that the client
 * treats as optional. Pure; reusable by the partner wizard (Epic 5).
 */

// errors.api.* message-key → form field. Only fields that render an INLINE error surface are listed
// (so a routed error always has somewhere to show). `specs` is intentionally omitted — the form has
// no group-level `specs` error container; required-spec drift is already caught by the step-1 client
// schema, and residual soft-deleted-spec drift falls through to the toast.
const MESSAGE_KEY_TO_FIELD: Readonly<Record<string, string>> = {
  'errors.api.modelKeyPreviouslyDeleted': 'modelKey',
  'errors.api.modelNotFound': 'modelKey',
  'errors.api.usedConditionKeyPreviouslyDeleted': 'usedConditionKey',
  'errors.api.usedConditionNotFound': 'usedConditionKey',
  'errors.api.logisticsProviderKeyPreviouslyDeleted': 'logisticsProviderKeys',
  'errors.api.logisticsProviderNotFound': 'logisticsProviderKeys',
  'errors.api.sensorKeyPreviouslyDeleted': 'sensorKeys',
  'errors.api.sensorNotFound': 'sensorKeys',
  'errors.api.useCaseKeyPreviouslyDeleted': 'useCaseKeys',
  'errors.api.useCaseNotFound': 'useCaseKeys',
  'errors.api.cityKeyPreviouslyDeleted': 'cityKey',
  'errors.api.countryKeyPreviouslyDeleted': 'countryKey',
};

// Raw-message substrings the i18n map does not cover. The listing backend resolves location via
// resolve-user-location and throws "Country not found" / "City not found" — absent from the message
// map, and the raw text carries no `countryKey`/`cityKey` token — so match the raw text directly.
const RAW_MESSAGE_TO_FIELD: Readonly<Record<string, string>> = {
  'country not found': 'countryKey',
  'city not found': 'cityKey',
};

export type SubmitErrorStepDef = Readonly<{ fieldNames: readonly string[] }>;

export function mapSubmitErrorToStep(
  error: unknown,
  steps: readonly SubmitErrorStepDef[],
): { stepIndex: number; fields: readonly string[] } | null {
  if (!(error instanceof AuthRequestError)) {
    return null;
  }
  const allFields = steps.flatMap((step) => [...step.fieldNames]);
  const hits = new Set<string>();

  // 1) known catalog/domain message → exact field (via the i18n message-key map)
  const messageKey = lookupMessageKey(error.rawMessage);
  const mapped = messageKey ? MESSAGE_KEY_TO_FIELD[messageKey] : undefined;
  if (mapped) {
    hits.add(mapped);
  }

  // 2) raw-substring fallback for messages the i18n map does not cover (country/city not found)
  if (hits.size === 0 && error.rawMessage) {
    const lower = error.rawMessage.toLowerCase();
    for (const [needle, field] of Object.entries(RAW_MESSAGE_TO_FIELD)) {
      if (lower.includes(needle)) {
        hits.add(field);
      }
    }
  }

  // 3) class-validator 400 → token-match field names in the joined message (each message is prefixed
  // with its property name). Word-boundary match avoids substring false-positives.
  if (hits.size === 0 && error.status === 400 && error.rawMessage) {
    for (const field of allFields) {
      if (new RegExp(`\\b${field}\\b`).test(error.rawMessage)) {
        hits.add(field);
      }
    }
  }

  if (hits.size === 0) {
    return null;
  }

  // earliest step that owns any hit field
  for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
    const owned = steps[stepIndex]?.fieldNames.filter((field) => hits.has(field)) ?? [];
    if (owned.length > 0) {
      return { stepIndex, fields: owned };
    }
  }
  return null;
}
