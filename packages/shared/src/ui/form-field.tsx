import { FieldInlineError } from './field-inline-error';
import { cn } from '../lib/utils';

type FormFieldProps = Readonly<{
  id: string;
  label: string;
  hint?: string;
  hintPlacement?: 'label' | 'field';
  error?: string;
  touched?: boolean;
  children: React.ReactNode;
  className?: string;
}>;

export function FormField({
  id,
  label,
  hint,
  hintPlacement = 'label',
  error,
  touched,
  children,
  className,
}: FormFieldProps) {
  const showError = Boolean(touched && error);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={cn('space-y-2', className)}>
      <div className={cn(hintPlacement === 'label' && hint && 'space-y-1')}>
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {hint && hintPlacement === 'label' ? (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="relative min-w-0 overflow-visible">
        {children}
        {showError && error ? (
          <FieldInlineError id={errorId} message={error} />
        ) : null}
      </div>
      {hint && hintPlacement === 'field' ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClassName = cn(
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground',
  'outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring',
  'aria-invalid:border-destructive/50 aria-invalid:ring-destructive/15',
);
