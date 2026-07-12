'use client';

import { useCallback } from 'react';
import { useField } from 'formik';
import { Checkbox } from '@constellation/shared/ui';
import { TEST_IDS } from '@constellation/shared';

type FormikActiveFieldProps = Readonly<{
  name?: string;
  label: string;
  hint?: string;
  testId?: string;
}>;

export function FormikActiveField({ name = 'isActive', label, hint, testId }: FormikActiveFieldProps) {
  const [field, , helpers] = useField<boolean>(name);

  const onActiveChange = useCallback(
    (checked: boolean) => {
      void helpers.setValue(checked);
    },
    [helpers],
  );

  return (
    <div className="flex flex-col gap-1">
      <Checkbox
        checked={field.value ?? false}
        onCheckedChange={onActiveChange}
        label={label}
        testId={testId ?? TEST_IDS.field(name)}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
