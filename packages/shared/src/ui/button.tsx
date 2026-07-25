import { cn } from '../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'success' | 'warning';

type ButtonProps = Readonly<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    fullWidth?: boolean;
    /** Stable hook for tests, rendered as `data-testid`. */
    testId?: string;
  }
>;

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  secondary:
    'border border-border bg-card text-secondary-foreground shadow-sm hover:bg-muted',
  outline: 'border border-border bg-background text-foreground hover:bg-muted',
  success: 'bg-success text-success-foreground hover:opacity-90',
  warning: 'bg-warning text-warning-foreground hover:opacity-90',
};

export function Button({ variant = 'primary', fullWidth = true, className, type = 'button', testId, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      data-testid={testId}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50',
        fullWidth && 'w-full',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
