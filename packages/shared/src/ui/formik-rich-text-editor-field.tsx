'use client';

import { useField } from 'formik';
import { useCallback, useId } from 'react';
import type { RichTextEditorInsertHandle } from './rich-text-editor';
import { TEST_IDS } from '../test-ids';
import { FormField } from './form-field';
import { RichTextEditor } from './rich-text-editor';

type FormikRichTextEditorFieldProps = Readonly<{
  name: string;
  label: string;
  placeholder?: string;
  maxLength?: number;
  maxLengthMessage?: string;
  testId?: string | null;
  minHeightClassName?: string;
  onEditorReady?: (handle: RichTextEditorInsertHandle) => void;
}>;

export function FormikRichTextEditorField({
  name,
  label,
  placeholder,
  maxLength,
  maxLengthMessage,
  testId = null,
  minHeightClassName,
  onEditorReady,
}: FormikRichTextEditorFieldProps) {
  const id = useId();
  const [field, meta, helpers] = useField<string>(name);
  const fieldTestId = testId ?? TEST_IDS.field(name);
  const html = field.value ?? '';
  const lengthExceeded = maxLength !== undefined && html.length > maxLength;
  const error = lengthExceeded && maxLengthMessage ? maxLengthMessage : meta.error;
  const showError = Boolean((meta.touched && meta.error) || lengthExceeded);

  const onChange = useCallback(
    (nextHtml: string) => {
      void helpers.setValue(nextHtml);
      if (maxLength !== undefined && nextHtml.length > maxLength) {
        void helpers.setTouched(true);
      }
    },
    [helpers, maxLength],
  );
  const onBlur = useCallback(() => helpers.setTouched(true), [helpers]);

  return (
    <FormField id={id} label={label} error={error} touched={showError}>
      <RichTextEditor
        value={html}
        onChange={onChange}
        onBlur={onBlur}
        onEditorReady={onEditorReady}
        placeholder={placeholder}
        maxLength={maxLength}
        testId={fieldTestId}
        minHeightClassName={minHeightClassName}
        aria-invalid={showError}
        aria-describedby={showError ? `${id}-error` : undefined}
      />
    </FormField>
  );
}
