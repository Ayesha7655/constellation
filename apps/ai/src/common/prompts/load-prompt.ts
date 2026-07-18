import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const productionCache = new Map<string, string>();

/**
 * Resolve `apps/ai/prompts` whether the process is started from the package root,
 * the monorepo root, or via an explicit `AI_PROMPTS_DIR` override.
 */
export function resolvePromptsRoot(): string {
  const fromEnv = process.env.AI_PROMPTS_DIR?.trim();
  if (fromEnv) {
    return resolve(fromEnv);
  }

  const candidates = [
    join(process.cwd(), 'prompts'),
    join(process.cwd(), 'apps', 'ai', 'prompts'),
    // dist/common/prompts → apps/ai/prompts
    join(__dirname, '..', '..', '..', 'prompts'),
    // dist/src/common/prompts (some Nest layouts) → apps/ai/prompts
    join(__dirname, '..', '..', '..', '..', 'prompts'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `AI prompts directory not found. Set AI_PROMPTS_DIR or run from apps/ai (looked in: ${candidates.join(', ')})`,
  );
}

/**
 * Load a markdown prompt file relative to the prompts root (e.g. `upwork-filter/system.md`).
 * Cached in production; re-read on every call in development so edits apply without rebuild.
 */
export function loadPrompt(relativePath: string): string {
  const cacheEnabled = process.env.NODE_ENV === 'production';
  if (cacheEnabled) {
    const cached = productionCache.get(relativePath);
    if (cached !== undefined) {
      return cached;
    }
  }

  const fullPath = join(resolvePromptsRoot(), relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`AI prompt file missing: ${fullPath}`);
  }

  const content = readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '').trim();
  if (!content) {
    throw new Error(`AI prompt file is empty: ${fullPath}`);
  }

  if (cacheEnabled) {
    productionCache.set(relativePath, content);
  }
  return content;
}

/** Replace `{{KEY}}` placeholders. Unknown keys are left untouched. */
export function renderPromptTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : value;
  });
}
