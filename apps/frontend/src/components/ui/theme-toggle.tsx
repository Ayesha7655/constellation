'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { TEST_IDS } from '@constellation/shared';
import { useIsClient } from '@/hooks/use-is-client';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsClient();

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        data-testid={TEST_IDS.nav.themeToggle}
        className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground"
        disabled
      />
    );
  }

  const isDark = resolvedTheme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-testid={TEST_IDS.nav.themeToggle}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-md border border-border',
        'bg-background text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <Icon className="size-[18px]" aria-hidden />
    </button>
  );
}
