'use client';

import { useField } from 'formik';
import { useCallback, useId } from 'react';
import { TEST_IDS } from '../test-ids';
import { DateTimePicker } from './date-time-picker';
import { FormField } from './form-field';

type FormikDateTimePickerFieldProps = Readonly<{
  name: string;
  label: string;
  timeAriaLabel: string;
  min?: Date;
  disabled?: boolean;
  dir?: 'ltr' | 'rtl';
  placeholder?: string;
  testId?: string | null;
  placement?: import('./date-time-picker').DateTimePickerPlacement;
}>;

export function FormikDateTimePickerField({
  name,
  label,
  timeAriaLabel,
  min,
  disabled = false,
  dir,
  placeholder,
  testId = null,
  placement = 'auto',
}: FormikDateTimePickerFieldProps) {
  const id = useId();
  const [field, meta, helpers] = useField<string>(name);
  const fieldTestId = testId ?? TEST_IDS.field(name);
  const showError = Boolean(meta.touched && meta.error);

  const onChange = useCallback((next: string) => void helpers.setValue(next), [helpers]);
  const onBlur = useCallback(() => void helpers.setTouched(true), [helpers]);

  return (
    <FormField id={id} label={label} error={meta.error} touched={meta.touched}>
      <DateTimePicker
        value={field.value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        min={min}
        disabled={disabled}
        dir={dir}
        placeholder={placeholder}
        ariaInvalid={showError}
        testId={fieldTestId}
        timeAriaLabel={timeAriaLabel}
        placement={placement}
      />
    </FormField>
  );
}
