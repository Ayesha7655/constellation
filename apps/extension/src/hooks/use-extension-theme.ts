import { useCallback, useState } from 'react';
import { applyTheme, getAppliedTheme } from '../lib/extension-theme';
import { saveTheme } from '../lib/extension-storage';
import type { ExtensionTheme } from '../types';

export function useExtensionTheme(): {
  theme: ExtensionTheme;
  toggleTheme: () => void;
} {
  const [theme, setTheme] = useState<ExtensionTheme>(getAppliedTheme);

  const toggleTheme = useCallback(() => {
    const nextTheme: ExtensionTheme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    setTheme(nextTheme);
    void saveTheme(nextTheme);
  }, [theme]);

  return { theme, toggleTheme };
}
