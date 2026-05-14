import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDatabaseUrl } from '../server/database-url.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const databaseUrl = resolveDatabaseUrl(process.env.DATABASE_URL);

if (databaseUrl.startsWith('file:')) {
  const filePath = databaseUrl.slice('file:'.length);
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(rootDir, filePath);

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  if (!fs.existsSync(absolutePath)) {
    fs.closeSync(fs.openSync(absolutePath, 'w'));
  }
}
