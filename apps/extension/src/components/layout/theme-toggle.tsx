import { Moon, Sun } from 'lucide-react';
import { useExtensionTheme } from '../../hooks/use-extension-theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useExtensionTheme();
  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-testid="extension-theme-toggle"
      onClick={toggleTheme}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
