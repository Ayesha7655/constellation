'use client';

import { useCallback, useId } from 'react';
import { useField } from 'formik';
import { useTranslations } from 'next-intl';
import { TEST_IDS } from '@constellation/shared';
import { Checkbox, FormField } from '@constellation/shared/ui';

type FormikSpecBooleanFieldProps = Readonly<{
  name: string;
  label: string;
  hint?: string;
  readOnly?: boolean;
  required?: boolean;
  testId?: string;
}>;

function resolveBooleanDisplayValue(value: string, yesLabel: string, noLabel: string): string {
  if (value === 'true') {
    return yesLabel;
  }
  if (value === 'false') {
    return noLabel;
  }
  return '';
}

export function FormikSpecBooleanField({
  name,
  label,
  hint,
  readOnly = false,
  required = false,
  testId,
}: FormikSpecBooleanFieldProps) {
  const t = useTranslations('dashboard.listings.form.specBoolean');
  const id = useId();
  const [field, meta, helpers] = useField<string>(name);
  const currentValue = field.value ?? '';
  const showError = Boolean(meta.touched && meta.error);

  const onCheckedChange = useCallback(
    (checked: boolean) => {
      if (readOnly) {
        return;
      }
      const nextValue = required ? (checked ? 'true' : 'false') : checked ? 'true' : '';
      void helpers.setValue(nextValue, false);
      if (meta.error) {
        void helpers.setError(undefined);
      }
    },
    [helpers, meta.error, readOnly, required],
  );

  if (readOnly) {
    const display = resolveBooleanDisplayValue(currentValue, t('yes'), t('no'));
    return (
      <FormField id={id} label={label} hint={hint} hintPlacement="field">
        <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {display || '—'}
        </p>
      </FormField>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Checkbox
        checked={currentValue === 'true'}
        onCheckedChange={onCheckedChange}
        label={label}
        disabled={readOnly}
        testId={testId ?? TEST_IDS.listingForm.specBoolean(name.replace(/^specs\./, ''))}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {showError ? <p className="text-xs text-destructive">{meta.error}</p> : null}
    </div>
  );
}
