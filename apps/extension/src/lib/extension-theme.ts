import { getStoredTheme } from './extension-storage';
import type { ExtensionTheme } from '../types';

export function getSystemTheme(): ExtensionTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getAppliedTheme(): ExtensionTheme {
  const applied = document.documentElement.dataset.theme;
  return applied === 'light' || applied === 'dark' ? applied : getSystemTheme();
}

export function applyTheme(theme: ExtensionTheme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export async function initializeExtensionTheme(): Promise<void> {
  const stored = await getStoredTheme();
  applyTheme(stored ?? getSystemTheme());
}
