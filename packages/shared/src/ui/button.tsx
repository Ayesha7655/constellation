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
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-border bg-background text-foreground hover:bg-muted',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400',
  warning:
    'bg-amber-500 text-amber-950 hover:bg-amber-600 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-300',
};

export function Button({ variant = 'primary', fullWidth = true, className, type = 'button', testId, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      data-testid={testId}
      className={cn(
        'cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        fullWidth && 'w-full',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
