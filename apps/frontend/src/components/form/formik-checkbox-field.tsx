'use client';

import { useCallback } from 'react';
import { useField, useFormikContext } from 'formik';
import { Checkbox } from '@constellation/shared/ui';
import { TEST_IDS } from '@constellation/shared';

import { preserveDashboardMainScroll } from '@/lib/dashboard-scroll';

type FormikCheckboxFieldProps = Readonly<{
  name: string;
  label: string;
  hint?: string;
  testId?: string;
  disabled?: boolean;
  /** Clear the field error when the user checks the box (wizard disclosure fields). */
  clearErrorWhenChecked?: boolean;
}>;

export function FormikCheckboxField({
  name,
  label,
  hint,
  testId,
  disabled,
  clearErrorWhenChecked = false,
}: FormikCheckboxFieldProps) {
  const [field, , helpers] = useField<boolean>(name);
  const { setFieldError } = useFormikContext();

  const onCheckedChange = useCallback(
    (checked: boolean) => {
      preserveDashboardMainScroll(() => {
        void helpers.setValue(checked, false);
        if (clearErrorWhenChecked && checked) {
          void setFieldError(name, undefined);
        }
      });
    },
    [clearErrorWhenChecked, helpers, name, setFieldError],
  );

  return (
    <div className="flex flex-col gap-1">
      <Checkbox
        checked={field.value}
        onCheckedChange={onCheckedChange}
        label={label}
        disabled={disabled}
        testId={testId ?? TEST_IDS.field(name)}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
