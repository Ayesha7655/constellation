import { cn } from '../lib/utils';

type FormBannerVariant = 'error' | 'info' | 'warning';

type FormBannerTextAlign = 'center' | 'start';

type FormBannerTone = 'subtle' | 'emphasis';

type FormBannerProps = Readonly<{
  variant: FormBannerVariant;
  message: string;
  /** @default 'center' — auth banners stay centered; moderation notes use `start`. */
  textAlign?: FormBannerTextAlign;
  /** @default 'subtle' — `emphasis` uses stronger fills for in-context alerts (e.g. listing moderation). */
  tone?: FormBannerTone;
}>;

export function FormBanner({ variant, message, textAlign = 'center', tone = 'subtle' }: FormBannerProps) {
  return (
    <p
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        textAlign === 'center' && 'text-center',
        textAlign === 'start' && 'text-start',
        tone === 'subtle' && variant === 'error' && 'border-destructive/30 bg-destructive/10 text-destructive',
        tone === 'emphasis' && variant === 'error' && 'border-destructive/50 bg-destructive/15 text-destructive',
        tone === 'subtle' && variant === 'info' && 'border-border bg-muted text-muted-foreground',
        tone === 'emphasis' && variant === 'info' && 'border-primary/40 bg-primary/10 text-foreground',
        tone === 'subtle' && variant === 'warning' && 'border-accent bg-accent/15 text-foreground',
        tone === 'emphasis' && variant === 'warning' && 'border-accent/60 bg-accent/25 text-foreground',
      )}
    >
      {message}
    </p>
  );
}
