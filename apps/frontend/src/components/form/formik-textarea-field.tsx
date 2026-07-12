'use client';

import { useField } from 'formik';
import { useId } from 'react';
import { FormField, inputClassName } from '@constellation/shared/ui';
import { TEST_IDS } from '@constellation/shared';
import { cn } from '@/lib/utils';

type FormikTextareaFieldProps = Readonly<{
  name: string;
  label: string;
  rows?: number;
  testId?: string | null;
}>;

export function FormikTextareaField({ name, label, rows = 4, testId = null }: FormikTextareaFieldProps) {
  const id = useId();
  const [field, meta] = useField<string>(name);
  const showError = Boolean(meta.touched && meta.error);
  const fieldTestId = testId ?? TEST_IDS.field(name);

  return (
    <FormField id={id} label={label} error={meta.error} touched={meta.touched}>
      <textarea
        id={id}
        {...field}
        value={field.value ?? ''}
        rows={rows}
        data-testid={fieldTestId}
        aria-invalid={showError}
        aria-describedby={showError ? `${id}-error` : undefined}
        className={cn(inputClassName, 'min-h-24 resize-y py-2')}
      />
    </FormField>
  );
}
