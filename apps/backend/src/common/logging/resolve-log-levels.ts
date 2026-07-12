import type { LogLevel } from '@nestjs/common';

const ALLOWED: ReadonlySet<string> = new Set(['log', 'error', 'warn', 'debug', 'verbose', 'fatal']);

const LEVEL_ORDER: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose', 'fatal'];

/** Always enabled so misconfigured LOG_LEVEL=debug cannot hide failures. */
const CRITICAL_LEVELS: LogLevel[] = ['error', 'warn'];

const DEFAULT_LEVELS: LogLevel[] = ['error', 'warn', 'log'];

function sortLevels(levels: ReadonlySet<LogLevel>): LogLevel[] {
  return LEVEL_ORDER.filter((level) => levels.has(level));
}

export function resolveLogLevels(raw: string | undefined): LogLevel[] {
  if (!raw?.trim()) {
    return DEFAULT_LEVELS;
  }
  const parsed = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => ALLOWED.has(part)) as LogLevel[];
  if (parsed.length === 0) {
    return DEFAULT_LEVELS;
  }
  return sortLevels(new Set<LogLevel>([...CRITICAL_LEVELS, ...parsed]));
}
