import { execSync } from 'node:child_process';
import { join } from 'node:path';

export function resetDatabase(): void {
  const backendRoot = join(__dirname, '../../../..');
  execSync('pnpm exec ts-node --transpile-only -r dotenv/config src/database/reset-database.ts', {
    cwd: backendRoot,
    stdio: 'inherit',
    env: process.env,
  });
}
