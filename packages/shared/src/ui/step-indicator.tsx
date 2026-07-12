'use client';

import { AlertTriangle, Check } from 'lucide-react';
import { useCallback } from 'react';
import { cn } from '../lib/utils';

export type StepIndicatorItem = Readonly<{
  id: string;
  label: string;
  /**
   * Explicit completeness. When provided it wins over positional inference (`index < current`), so a
   * step stays correctly marked even after the user navigates past an incomplete hole (resume drift).
   */
  complete?: boolean;
  /** Flag a reachable, incomplete step that needs the user's attention (warning treatment). */
  needsAttention?: boolean;
}>;

type StepIndicatorProps = Readonly<{
  steps: readonly StepIndicatorItem[];
  currentStepIndex: number;
  maxReachableStepIndex?: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
  /** Base test id; each clickable step gets `${testId}-step-<id>`. */
  testId?: string;
  /** Visually-hidden label appended to a step flagged `needsAttention` (i18n, for a11y). */
  attentionLabel?: string;
}>;

export function StepIndicator({
  steps,
  currentStepIndex,
  maxReachableStepIndex,
  onStepClick,
  className,
  testId,
  attentionLabel,
}: StepIndicatorProps) {
  const reachableMax = maxReachableStepIndex ?? currentStepIndex;

  const onStepButtonClick = useCallback(
    (index: number) => {
      if (index <= reachableMax) {
        onStepClick?.(index);
      }
    },
    [onStepClick, reachableMax],
  );

  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol className="mx-auto flex max-w-lg items-start justify-center">
        {steps.map((step, index) => {
          // Explicit completeness wins; fall back to positional inference for callers that don't set it.
          const isComplete = step.complete ?? index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          // A reachable, incomplete step the caller flagged — shown with a warning treatment even when
          // the user has navigated past it (so a hole in the middle stays visible).
          const isNeedsAttention = Boolean(step.needsAttention) && !isCurrent && !isComplete;
          const isUpcoming = !isComplete && !isCurrent && !isNeedsAttention;
          const isReachable = index <= reachableMax && onStepClick !== undefined;

          const stepContent = (
            <>
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                  isComplete && 'border-primary bg-primary text-primary-foreground',
                  isNeedsAttention && 'border-accent/60 bg-accent/25 text-foreground',
                  isCurrent && 'border-primary bg-background text-primary',
                  isUpcoming && 'border-border bg-muted text-muted-foreground',
                )}
              >
                {isComplete ? (
                  <Check className="size-4" aria-hidden />
                ) : isNeedsAttention ? (
                  <AlertTriangle className="size-4" aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  'max-w-[6rem] truncate text-center text-xs sm:max-w-[7.5rem]',
                  isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
              {isNeedsAttention && attentionLabel ? <span className="sr-only">{attentionLabel}</span> : null}
            </>
          );

          return (
            <li key={step.id} className="flex items-center">
              {isReachable ? (
                <button
                  type="button"
                  aria-current={isCurrent ? 'step' : undefined}
                  data-testid={testId ? `${testId}-step-${step.id}` : undefined}
                  onClick={() => onStepButtonClick(index)}
                  className="flex flex-col items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  {stepContent}
                </button>
              ) : (
                <div aria-current={isCurrent ? 'step' : undefined} className="flex flex-col items-center gap-1.5 px-1">
                  {stepContent}
                </div>
              )}
              {index < steps.length - 1 ? (
                <div
                  className={cn('mx-1 mb-5 h-px w-8 shrink-0 sm:w-14', isComplete ? 'bg-primary' : 'bg-border')}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
