'use client';

import { useCallback, useId } from 'react';
import { useField } from 'formik';
import { FormField } from './form-field';
import {
  MultiSelectDropdown,
  type MultiSelectDropdownOption,
  type MultiSelectMenuPlacement,
} from './multi-select-dropdown';

export function FormikMultiSelectDropdownField({
  name,
  label,
  hint,
  options,
  ariaLabel,
  placeholder,
  emptyMessage,
  testId,
  menuPlacement,
}: Readonly<{
  name: string;
  label: string;
  hint?: string;
  options: readonly MultiSelectDropdownOption[];
  ariaLabel: string;
  placeholder: string;
  emptyMessage?: string;
  testId?: string;
  menuPlacement?: MultiSelectMenuPlacement;
}>) {
  const id = useId();
  const [field, meta, helpers] = useField<readonly string[]>(name);

  const onChange = useCallback(
    (nextValues: readonly string[]) => {
      void helpers.setValue([...nextValues], false);
      void helpers.setTouched(true, false);
      if (nextValues.length > 0 && meta.error) {
        void helpers.setError(undefined);
      }
    },
    [helpers, meta.error],
  );

  return (
    <FormField id={id} label={label} hint={hint} error={meta.error} touched={meta.touched}>
      <MultiSelectDropdown
        options={options}
        selectedValues={field.value}
        onChange={onChange}
        ariaLabel={ariaLabel}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
        fullWidth
        testId={testId}
        menuPlacement={menuPlacement}
        triggerClassName={meta.error && meta.touched ? 'border-destructive' : undefined}
      />
    </FormField>
  );
}
