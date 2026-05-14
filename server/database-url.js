export function resolveDatabaseUrl(databaseUrl = 'file:./dev.db') {
  return databaseUrl === 'file:./dev.db' ? 'file:./prisma/dev.db' : databaseUrl;
}
