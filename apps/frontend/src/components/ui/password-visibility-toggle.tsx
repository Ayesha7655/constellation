'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type PasswordVisibilityToggleProps = Readonly<{
  visible: boolean;
  onToggle: () => void;
  inputId: string;
  testId?: string;
}>;

export function PasswordVisibilityToggle({
  visible,
  onToggle,
  inputId,
  testId,
}: PasswordVisibilityToggleProps) {
  const t = useTranslations('passwordVisibility');
  const Icon = visible ? Eye : EyeOff;

  return (
    <button
      type="button"
      onClick={onToggle}
      data-testid={testId}
      aria-label={visible ? t('hide') : t('show')}
      aria-controls={inputId}
      aria-pressed={visible}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground end-2',
        'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <Icon className="size-[18px]" aria-hidden />
    </button>
  );
}
