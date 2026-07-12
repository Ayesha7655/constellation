import { FormBanner } from '@constellation/shared/ui';
import { TEST_IDS } from '@constellation/shared';
import { cn } from '@/lib/utils';

type AuthPageShellProps = Readonly<{
  title: string;
  description: string;
  error?: string | null;
  info?: string | null;
  children: React.ReactNode;
  footer: React.ReactNode;
  /** Default `md` (sign-in/up). Use `lg` for multi-step flows like join. */
  size?: 'md' | 'lg';
}>;

const sizeClassName = {
  md: 'max-w-md',
  lg: 'max-w-3xl',
} as const;

export function AuthPageShell({
  title,
  description,
  error,
  info,
  children,
  footer,
  size = 'md',
}: AuthPageShellProps) {
  return (
    <div className={cn('mx-auto w-full space-y-6', sizeClassName[size])}>
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {error ? (
        <div data-testid={TEST_IDS.auth.error}>
          <FormBanner variant="error" message={error} />
        </div>
      ) : null}
      {info ? <FormBanner variant="info" message={info} /> : null}

      {children}

      {footer}
    </div>
  );
}
