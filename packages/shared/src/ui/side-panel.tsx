'use client';

import { X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/utils';

const PANEL_ANIMATION_MS = 300;

type SidePanelProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  headerActions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Base test id; the panel gets `testId`, the close button `${testId}-close`. */
  testId?: string;
}>;

export function SidePanel({
  open,
  onOpenChange,
  title,
  description,
  headerActions,
  children,
  footer,
  className,
  testId,
}: SidePanelProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  const onClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const onBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const onCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      const timer = window.setTimeout(() => {
        setMounted(false);
      }, PANEL_ANIMATION_MS);
      return () => {
        window.clearTimeout(timer);
      };
    }

    setMounted(true);
    setVisible(false);

    let enterFrame1 = 0;
    let enterFrame2 = 0;
    enterFrame1 = window.requestAnimationFrame(() => {
      enterFrame2 = window.requestAnimationFrame(() => {
        setVisible(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(enterFrame1);
      window.cancelAnimationFrame(enterFrame2);
    };
  }, [open]);

  useEffect(() => {
    if (!mounted) {
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
  }, [mounted, onClose]);

  useEffect(() => {
    if (visible) {
      panelRef.current?.focus();
    }
  }, [visible]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className={cn(
          'absolute inset-0 bg-background/80 transition-opacity duration-300 ease-out motion-reduce:transition-none',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onBackdropClick}
        aria-label="Close panel"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        data-testid={testId}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex h-full w-full max-w-xl flex-col overflow-hidden border-border bg-card shadow-sm outline-none sm:border-s',
          visible ? 'translate-x-0' : 'translate-x-full',
          open && !visible
            ? 'transition-none motion-reduce:translate-x-0'
            : 'transition-transform duration-300 ease-out motion-reduce:transition-none motion-reduce:translate-x-0',
          className,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 id={titleId} className="text-lg font-semibold text-card-foreground">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {headerActions}
            <button
              type="button"
              onClick={onCloseClick}
              data-testid={testId ? `${testId}-close` : undefined}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-border px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
