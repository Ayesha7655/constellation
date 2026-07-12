'use client';

import { useField } from 'formik';
import { useCallback, useId } from 'react';
import { TEST_IDS } from '@constellation/shared';
import { Dropdown, FormField, type DropdownOption } from '@constellation/shared/ui';

type FormikDropdownFieldProps<T extends string = string> = Readonly<{
  name: string;
  label: string;
  options: readonly DropdownOption<T>[];
  ariaLabel: string;
  disabled?: boolean;
  testId?: string | null;
}>;

export function FormikDropdownField<T extends string = string>({
  name,
  label,
  options,
  ariaLabel,
  disabled = false,
  testId = null,
}: FormikDropdownFieldProps<T>) {
  const id = useId();
  const [field, meta, helpers] = useField<T>(name);
  const fieldTestId = testId ?? TEST_IDS.field(name);

  const onChange = useCallback(
    (value: T) => {
      void helpers.setValue(value, true);
      void helpers.setTouched(true, false);
    },
    [helpers],
  );

  return (
    <FormField id={id} label={label} error={meta.error} touched={meta.touched}>
      <Dropdown
        value={field.value ?? ('' as T)}
        options={options}
        onChange={onChange}
        ariaLabel={ariaLabel}
        disabled={disabled}
        fullWidth
        testId={fieldTestId}
      />
    </FormField>
  );
}
