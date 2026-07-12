import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const META_TABLE = 'sequelize_meta';

async function ensureMetaTable(client: pg.Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "${META_TABLE}" (
      "name" VARCHAR(255) PRIMARY KEY
    )
  `);
}

async function getAppliedMigrations(client: pg.Client): Promise<Set<string>> {
  const result = await client.query<{ name: string }>(`SELECT "name" FROM "${META_TABLE}" ORDER BY "name"`);
  return new Set(result.rows.map((row) => row.name));
}

export async function runMigrations(connectionString: string): Promise<void> {
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    await ensureMetaTable(client);
    const applied = await getAppliedMigrations(client);
    const migrationsDir = join(__dirname, 'migrations');
    const files = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        continue;
      }

      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      console.log(`→ migrate: ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(`INSERT INTO "${META_TABLE}" ("name") VALUES ($1)`, [file]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }
  await runMigrations(connectionString);
  console.log('Migrations complete');
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}
