import { cn } from '../lib/utils';

export type StatusBadgeVariant =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'inactive'
  | 'partner'
  | 'seller'
  | 'secondary'
  | 'admin'
  | 'authGoogle'
  | 'authApple'
  | 'authPassword'
  | 'primary'
  | 'emerald'
  | 'muted'
  | 'outline'
  | 'sky'
  | 'amber'
  | 'violet';

const variantClasses: Record<StatusBadgeVariant, string> = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  approved: 'border-primary/30 bg-primary/10 text-primary',
  rejected: 'border-destructive/30 bg-destructive/10 text-destructive',
  inactive: 'border-border bg-muted text-muted-foreground',
  partner:
    'border-violet-500/35 bg-violet-500/12 text-violet-800 dark:border-violet-400/35 dark:bg-violet-500/15 dark:text-violet-200',
  seller:
    'border-emerald-600/35 bg-emerald-500/12 text-emerald-800 dark:border-emerald-400/35 dark:bg-emerald-500/15 dark:text-emerald-200',
  secondary:
    'border-sky-500/35 bg-sky-500/12 text-sky-800 dark:border-sky-400/35 dark:bg-sky-500/15 dark:text-sky-200',
  admin:
    'border-orange-500/35 bg-orange-500/12 text-orange-800 dark:border-orange-400/35 dark:bg-orange-500/15 dark:text-orange-200',
  authGoogle:
    'border-blue-500/35 bg-blue-500/12 text-blue-800 dark:border-blue-400/35 dark:bg-blue-500/15 dark:text-blue-200',
  authApple:
    'border-zinc-500/35 bg-zinc-500/12 text-zinc-800 dark:border-zinc-400/35 dark:bg-zinc-500/15 dark:text-zinc-200',
  authPassword: 'border-primary/30 bg-primary/10 text-primary',
  primary: 'border-primary/30 bg-primary/10 text-primary',
  emerald:
    'border-emerald-600/35 bg-emerald-500/12 text-emerald-800 dark:border-emerald-400/35 dark:bg-emerald-500/15 dark:text-emerald-200',
  muted: 'border-border bg-muted text-muted-foreground',
  outline: 'border-border bg-background text-foreground',
  sky: 'border-sky-500/35 bg-sky-500/12 text-sky-800 dark:border-sky-400/35 dark:bg-sky-500/15 dark:text-sky-200',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  violet:
    'border-violet-500/35 bg-violet-500/12 text-violet-800 dark:border-violet-400/35 dark:bg-violet-500/15 dark:text-violet-200',
};

type StatusBadgeProps = Readonly<{
  label: string;
  variant: StatusBadgeVariant;
  className?: string;
}>;

export function StatusBadge({ label, variant, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit max-w-full items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}
