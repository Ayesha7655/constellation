import { cn } from '../lib/utils';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'muted';
};

const variants = {
  default: 'bg-primary text-primary-foreground',
  success: 'bg-accent text-accent-foreground',
  muted: 'bg-muted text-muted-foreground',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
      )}
    >
      {children}
    </span>
  );
}
