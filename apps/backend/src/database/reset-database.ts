import pg from 'pg';
import { runMigrations } from './migrate';

async function resetDatabase(connectionString: string): Promise<void> {
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    console.log('→ reset: drop and recreate public schema');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO public');
  } finally {
    await client.end();
  }

  await runMigrations(connectionString);
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }
  await resetDatabase(connectionString);
  console.log('Database reset complete');
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error('Database reset failed:', error);
    process.exit(1);
  });
}

export { resetDatabase };
