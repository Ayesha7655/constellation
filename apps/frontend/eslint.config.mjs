import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { requireTestId } from "./eslint-rules/require-testid.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Require data-testid on interactive host elements. Coverage is complete
  // (audit = 0), so this is enforced as an error — new interactive UI must
  // ship a data-testid (or use a shared primitive's testId prop).
  {
    files: ["src/**/*.tsx"],
    plugins: { "test-id": { rules: { "require-testid": requireTestId } } },
    rules: { "test-id/require-testid": "error" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
