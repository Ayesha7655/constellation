import { modernMinimalTheme } from './themes/modern-minimal';
import type { TweakcnTheme } from './types';

/** All tweakcn themes. Add new entries here when introducing additional themes. */
export const tweakcnThemeRegistry = {
  [modernMinimalTheme.id]: modernMinimalTheme,
} as const satisfies Record<string, TweakcnTheme>;

export type TweakcnThemeId = keyof typeof tweakcnThemeRegistry;

export function getTweakcnTheme(id: TweakcnThemeId): TweakcnTheme {
  const theme = tweakcnThemeRegistry[id];
  if (!theme) {
    throw new Error(`Unknown theme: ${id}`);
  }
  return theme;
}

export function listTweakcnThemes(): TweakcnTheme[] {
  return Object.values(tweakcnThemeRegistry);
}
