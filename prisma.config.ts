import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

const databaseUrl = env('DATABASE_URL');
const resolvedDatabaseUrl = databaseUrl === 'file:./dev.db' ? 'file:./prisma/dev.db' : databaseUrl;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    url: resolvedDatabaseUrl,
  },
});
