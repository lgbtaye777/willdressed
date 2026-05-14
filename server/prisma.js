import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { resolveDatabaseUrl } from './database-url.js';

const adapter = new PrismaBetterSqlite3({
  url: resolveDatabaseUrl(process.env.DATABASE_URL),
});

export const prisma = new PrismaClient({ adapter });
