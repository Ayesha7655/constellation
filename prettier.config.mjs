/**
 * Shared Prettier config for the monorepo.
 *
 * Line breaks after `=` (value on the next line) come from printWidth — Prettier
 * wraps long lines. There is no option to turn that off globally; use
 * `// prettier-ignore` above a line you need to keep unbroken (e.g. long Tailwind strings).
 */
/** @type {import('prettier').Config} */
const config = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 120,
};

export default config;
