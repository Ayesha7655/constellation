'use client';

import { X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '../lib/utils';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

const dialogSizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-md max-h-[min(85vh,32rem)]',
  md: 'max-w-lg max-h-[min(85vh,40rem)]',
  lg: 'max-w-4xl max-h-[min(90vh,48rem)]',
  xl: 'max-w-5xl max-h-[min(92vh,52rem)]',
};

type DialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: DialogSize;
  className?: string;
  /** When false, clicking the backdrop does not close the dialog. @default true */
  closeOnBackdropClick?: boolean;
  /** Base test id; the panel gets `testId`, the close button `${testId}-close`. */
  testId?: string;
}>;

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  closeOnBackdropClick = true,
  testId,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const onClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const onBackdropClick = useCallback(() => {
    if (!closeOnBackdropClick) {
      return;
    }
    onClose();
  }, [closeOnBackdropClick, onClose]);

  const onCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  useEffect(() => {
    if (open) {
      panelRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {closeOnBackdropClick ? (
        <button
          type="button"
          className="absolute inset-0 bg-background/80"
          onClick={onBackdropClick}
          aria-label="Close dialog"
        />
      ) : (
        <div className="absolute inset-0 bg-background/80" aria-hidden />
      )}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        data-testid={testId}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg outline-none',
          dialogSizeClasses[size],
          className,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} className="text-lg font-semibold text-card-foreground">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onCloseClick}
            data-testid={testId ? `${testId}-close` : undefined}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-border px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
