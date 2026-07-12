import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Do not use env('DATABASE_URL') — it throws when the var is missing, even for
// `prisma generate`, which does not connect to a database. See:
// https://www.prisma.io/docs/orm/reference/prisma-config-reference#datasourceurl
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/constellation?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
