'use client';

import { FileText, Upload, X } from 'lucide-react';
import { useCallback, useId, useRef } from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { FieldInlineError } from './field-inline-error';

export type UploadedFileValue = Readonly<{
  fileName: string;
  sizeBytes: number;
  mimeType: string;
}>;

type FileUploadFieldProps = Readonly<{
  id?: string;
  label: string;
  description?: string;
  accept?: string;
  value: UploadedFileValue | null;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  uploadLabel: string;
  replaceLabel: string;
  removeLabel: string;
  emptyHint: string;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  className?: string;
  /** When true, the upload/replace button spans the card width. Defaults to true. */
  fullWidth?: boolean;
  /** Base test id; input gets `testId`, buttons `${testId}-upload` / `-remove`. */
  testId?: string;
}>;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadField({
  id: idProp,
  label,
  description,
  accept = '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp',
  value,
  error,
  touched,
  disabled,
  required,
  uploadLabel,
  replaceLabel,
  removeLabel,
  emptyHint,
  onFileSelect,
  onClear,
  className,
  testId,
}: FileUploadFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const showError = Boolean(touched && error);

  const onInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
      event.target.value = '';
    },
    [onFileSelect],
  );

  const onUploadClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onRemoveClick = useCallback(() => {
    onClear();
  }, [onClear]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="space-y-1">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </label>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>

      <div className="relative min-w-0 overflow-visible">
        <input
          ref={inputRef}
          id={id}
          data-testid={testId}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled}
          onChange={onInputChange}
          aria-invalid={showError}
          aria-describedby={showError ? `${id}-error` : undefined}
        />

        {value ? (
          <div
            className={cn(
              'flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3',
              showError && 'border-destructive/50',
            )}
          >
            <div className="flex min-w-0 items-start gap-2">
              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{value.fileName}</p>
                {value.sizeBytes > 0 ? (
                  <p className="text-xs text-muted-foreground">{formatFileSize(value.sizeBytes)}</p>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="outline"
                fullWidth={false}
                disabled={disabled}
                onClick={onUploadClick}
                testId={testId ? `${testId}-upload` : undefined}
                className="inline-flex items-center gap-2 px-3 py-1.5"
              >
                <Upload className="size-4" aria-hidden />
                {replaceLabel}
              </Button>
              <button
                type="button"
                disabled={disabled}
                onClick={onRemoveClick}
                data-testid={testId ? `${testId}-remove` : undefined}
                aria-label={removeLabel}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={onUploadClick}
            data-testid={testId ? `${testId}-upload` : undefined}
            aria-label={uploadLabel}
            className={cn(
              'flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-10 transition-colors',
              'hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:pointer-events-none disabled:opacity-50',
              showError && 'border-destructive/50',
            )}
          >
            <Upload className="size-8 text-muted-foreground" aria-hidden />
            <span className="text-sm text-muted-foreground">{emptyHint}</span>
          </button>
        )}

        {showError && error ? <FieldInlineError id={`${id}-error`} message={error} /> : null}
      </div>
    </div>
  );
}
