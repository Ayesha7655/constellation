import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ViewportShellProps = Readonly<{
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Extra classes on the scrollable main region (below the header). */
  mainClassName?: string;
}>;

/** Full-viewport shell: header fixed, main scrolls when content overflows. */
export function ViewportShell({ header, children, footer, mainClassName }: ViewportShellProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0">{header}</div>
      <main className={cn('min-h-0 flex-1 overflow-y-auto', mainClassName)}>{children}</main>
      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
}
