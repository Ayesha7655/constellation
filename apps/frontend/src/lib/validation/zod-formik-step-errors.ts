import type { FormikErrors } from 'formik';
import type { z } from 'zod';

function setDeepValue(target: Record<string, unknown>, path: readonly PropertyKey[], value: unknown): void {
  if (path.length === 0) {
    return;
  }

  let current: Record<string, unknown> = target;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = String(path[index]);
    const existing = current[key];
    if (typeof existing !== 'object' || existing === null || Array.isArray(existing)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[String(path[path.length - 1])] = value;
}

function hasDeepValue(target: Record<string, unknown>, path: readonly PropertyKey[]): boolean {
  let current: unknown = target;
  for (const segment of path) {
    if (typeof current !== 'object' || current === null || Array.isArray(current)) {
      return false;
    }
    current = (current as Record<string, unknown>)[String(segment)];
  }
  return current !== undefined;
}

export function zodIssuesToFormikErrors(issues: readonly z.ZodIssue[]): FormikErrors<Record<string, unknown>> {
  const errors: Record<string, unknown> = {};
  for (const issue of issues) {
    if (issue.path.length === 0) {
      continue;
    }
    if (!hasDeepValue(errors, issue.path)) {
      setDeepValue(errors, issue.path, issue.message);
    }
  }
  return errors as FormikErrors<Record<string, unknown>>;
}

export function buildStepValidationTouched(
  fieldNames: readonly string[],
  issues: readonly z.ZodIssue[],
  nestedFieldNames: readonly string[] = ['specs'],
): Record<string, unknown> {
  const nested = new Set(nestedFieldNames);
  const touched: Record<string, unknown> = {};

  for (const name of fieldNames) {
    if (!nested.has(name)) {
      touched[name] = true;
    }
  }

  for (const issue of issues) {
    setDeepValue(touched, issue.path, true);
  }

  return touched;
}
