// =============================================================
// ORDOMOTIK - Next.js Instrumentation
// Runs inside the Next.js process (Coolify can't override this)
// Uses sqlite3 CLI via child_process (Prisma can't connect in Docker)
// Only runs in production (local dev uses Prisma directly)
// =============================================================

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // In development, Prisma handles everything via db push
  if (process.env.NODE_ENV !== 'production') return;

  console.log('[init] Running database initialization...');

  // Derive DB path from DATABASE_URL
  const dbUrl = process.env.DATABASE_URL || 'file:/app/data/qrdomotik.db';
  // Handle file:/path or file:./relative/path
  let dbPath: string;
  if (dbUrl.includes('://')) {
    // file:///absolute/path or file:/absolute/path
    dbPath = dbUrl.replace(/^file:\/+/, '/');
  } else {
    // file:./relative/path
    dbPath = join(process.cwd(), dbUrl.replace(/^file:/, ''));
  }

  // Ensure data directory exists
  mkdirSync(dirname(dbPath), { recursive: true });

  // Find SQL files (try /app/data/ first, then relative to CWD)
  const searchPaths = [
    join(dirname(dbPath), 'schema.sql'),
    '/app/data/schema.sql',
    '/app/scripts/schema.sql',
    join(process.cwd(), 'scripts', 'schema.sql'),
  ];

  const seedSearchPaths = [
    join(dirname(dbPath), 'seed-users.sql'),
    '/app/data/seed-users.sql',
    '/app/scripts/seed-users.sql',
    join(process.cwd(), 'scripts', 'seed-users.sql'),
  ];

  const schemaPath = searchPaths.find(p => existsSync(p));
  const seedPath = seedSearchPaths.find(p => existsSync(p));

  if (!schemaPath) {
    console.error('[init] FATAL: schema.sql not found');
    return;
  }

  console.log('[init] schema.sql:', schemaPath);
  console.log('[init] DB path:', dbPath);
  console.log('[init] CWD:', process.cwd());

  // Verify sqlite3 is available
  try {
    const ver = execSync('sqlite3 --version', { encoding: 'utf-8' }).trim();
    console.log('[init] sqlite3:', ver);
  } catch {
    console.error('[init] FATAL: sqlite3 CLI not available');
    return;
  }

  // Create tables
  try {
    execSync(`sqlite3 "${dbPath}" < "${schemaPath}"`, { stdio: 'pipe' });
    console.log('[init] Schema OK');
  } catch (err) {
    console.error('[init] Schema FAILED:', String(err).substring(0, 300));
  }

  // Seed users
  if (seedPath) {
    try {
      execSync(`sqlite3 "${dbPath}" < "${seedPath}"`, { stdio: 'pipe' });
      console.log('[init] Users seeded OK');
    } catch (err) {
      console.error('[init] Seed FAILED:', String(err).substring(0, 300));
    }
  }
}
