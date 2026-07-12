'use client';

import { WandSparkles } from 'lucide-react';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';

export function isDevFormAutofillEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEV_FORM_AUTOFILL_ENABLED === 'true';
}

export type DevFormAutofillPlacement = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

const placementStyle: Record<DevFormAutofillPlacement, CSSProperties> = {
  'top-start': {
    top: 50,
    left: 50,
  },
  'top-end': {
    top: 50,
    right: 50,
  },
  'bottom-start': {
    bottom: 50,
    left: 50,
  },
  'bottom-end': {
    bottom: 50,
    right: 50,
  },
};

type DevFormAutofillButtonProps = Readonly<{
  onAutofill: () => void;
  label?: string;
  placement?: DevFormAutofillPlacement;
  className?: string;
}>;

export function DevFormAutofillButton({
  onAutofill,
  label = 'Autofill form',
  placement = 'top-end',
  className,
}: DevFormAutofillButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onAutofillClick = useCallback(() => {
    onAutofill();
  }, [onAutofill]);

  if (!isDevFormAutofillEnabled() || !mounted) {
    return null;
  }

  return createPortal(
    <button
      type="button"
      onClick={onAutofillClick}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-full absolute z-50',
        'border border-border bg-card text-card-foreground shadow-md transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      style={placementStyle[placement]}
    >
      <WandSparkles className="size-5" aria-hidden />
    </button>,
    document.body,
  );
}
