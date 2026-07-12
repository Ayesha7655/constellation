'use client';

import { useField } from 'formik';
import { useCallback, useId, useState } from 'react';
import { FormField, inputClassName } from '@constellation/shared/ui';
import { TEST_IDS } from '@constellation/shared';
import { PasswordVisibilityToggle } from '@/components/ui/password-visibility-toggle';
import { cn } from '@/lib/utils';

type FormikTextFieldProps = Readonly<{
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
  inputMode?: 'text' | 'numeric' | 'decimal';
  autoComplete?: string;
  /** Stable hook for tests, rendered as `data-testid` on the input. */
  testId?: string;
  readOnly?: boolean;
}>;

export function FormikTextField({
  name,
  label,
  hint,
  placeholder,
  type = 'text',
  inputMode,
  autoComplete,
  testId,
  readOnly = false,
}: FormikTextFieldProps) {
  const id = useId();
  const [field, meta] = useField<string>(name);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const showError = Boolean(meta.touched && meta.error);
  const isPassword = type === 'password';
  // Default test id derives from the Formik field name (e.g. `field-email`);
  // pass `testId` for a screen-scoped id where uniqueness needs it.
  const fieldTestId = testId ?? TEST_IDS.field(name);

  const togglePasswordVisibility = useCallback(() => {
    setPasswordVisible((current) => !current);
  }, []);

  const inputType = isPassword && passwordVisible ? 'text' : type;

  return (
    <FormField
      id={id}
      label={label}
      hint={hint}
      error={meta.error}
      touched={meta.touched}
    >
      <input
        id={id}
        {...field}
        value={field.value ?? ''}
        type={inputType}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        readOnly={readOnly}
        data-testid={fieldTestId}
        aria-invalid={showError}
        aria-readonly={readOnly || undefined}
        aria-describedby={showError ? `${id}-error` : undefined}
        className={cn(inputClassName, isPassword && 'pe-10', readOnly && 'cursor-default bg-muted/50')}
      />
      {isPassword ? (
        <PasswordVisibilityToggle
          visible={passwordVisible}
          onToggle={togglePasswordVisibility}
          inputId={id}
          testId={`${fieldTestId}-toggle`}
        />
      ) : null}
    </FormField>
  );
}
