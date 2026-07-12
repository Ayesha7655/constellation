import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AdminPageLayoutWidth = 'constrained' | 'full';

type AdminPageLayoutProps = Readonly<{
  title: string;
  description?: string;
  /** Back navigation rendered above the page title row (top-left). */
  backLink?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** @default 'constrained' — centered column (`max-w-5xl`); use `full` for edge-to-edge content */
  width?: AdminPageLayoutWidth;
  /** Fill dashboard main area; overflow hidden so paginated tables scroll rows only. */
  fillViewport?: boolean;
  className?: string;
}>;

export function AdminPageLayout({
  title,
  description,
  backLink,
  actions,
  children,
  width = 'constrained',
  fillViewport = false,
  className,
}: AdminPageLayoutProps) {
  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col gap-6',
        width === 'constrained' && 'mx-auto max-w-5xl',
        fillViewport && 'min-h-0 flex-1 overflow-hidden',
        className,
      )}
    >
      {backLink ? <div className="shrink-0">{backLink}</div> : null}
      <div
        className={cn(
          'flex shrink-0 flex-col gap-4',
          actions !== undefined && actions !== null ? 'sm:flex-row sm:items-start sm:justify-between' : undefined,
        )}
      >
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? <p className="text-muted-foreground">{description}</p> : null}
        </div>
        {actions !== undefined && actions !== null ? <div className="flex shrink-0">{actions}</div> : null}
      </div>
      {fillViewport ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
