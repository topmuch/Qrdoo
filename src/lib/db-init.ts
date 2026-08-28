// =============================================================
// ORDOMOTIK - Database Init (runs inside Next.js process)
// Called by instrumentation.ts on server startup
// Creates tables from schema.sql + seeds admin/demo users
// =============================================================

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';

let initialized = false;

export async function initDatabase() {
  if (initialized) return;
  initialized = true;

  console.log('[db-init] Starting database initialization...');
  console.log('[db-init] CWD:', process.cwd());
  console.log('[db-init] DATABASE_URL env:', process.env.DATABASE_URL);

  try {
    const schemaOk = await initSchema();
    if (schemaOk) {
      await seedUsers();
    }
    console.log('[db-init] COMPLETE.');
  } catch (err) {
    console.error('[db-init] FATAL:', err);
    initialized = false;
  }
}

// ── 1. Create tables from schema.sql ──
// Strategy: try PrismaClient first, fall back to sqlite3 CLI
async function initSchema(): Promise<boolean> {
  const sqlPath = findSchemaSql();
  if (!sqlPath) {
    console.error('[db-init] FATAL: schema.sql not found');
    return false;
  }

  console.log('[db-init] Found schema.sql at:', sqlPath);

  const sql = fs.readFileSync(sqlPath, 'utf-8');
  const statements = parseStatements(sql);
  console.log(`[db-init] Parsed ${statements.length} SQL statements`);

  // Try Prisma first
  let errors = 0;
  for (let i = 0; i < statements.length; i++) {
    try {
      await db.$executeRawUnsafe(statements[i] + ';');
    } catch {
      errors++;
      if (errors === 1) {
        console.log('[db-init] Prisma failed, switching to sqlite3 CLI...');
        // First Prisma error → switch to sqlite3 CLI for all remaining
        errors = await initSchemaSqlite3(sqlPath);
        return errors === 0;
      }
    }
  }

  if (errors === 0) {
    console.log(`[db-init] Schema done via Prisma. (${statements.length} stmts)`);
    return true;
  }

  // Prisma failed completely, try sqlite3 CLI
  return (await initSchemaSqlite3(sqlPath)) === 0;
}

// ── Fallback: use sqlite3 CLI ──
async function initSchemaSqlite3(sqlPath: string): Promise<number> {
  const dbPath = '/app/data/qrdomotik.db';
  console.log('[db-init] Trying sqlite3 CLI:', dbPath);

  try {
    // Test if sqlite3 is available
    execSync('sqlite3 --version', { stdio: 'pipe' });
  } catch {
    console.error('[db-init] sqlite3 CLI not available! Schema creation FAILED.');
    return 999;
  }

  try {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const output = execSync(`sqlite3 "${dbPath}" < "${sqlPath}" 2>&1`, {
      encoding: 'utf-8',
      timeout: 30000,
    });
    if (output) {
      console.log('[db-init] sqlite3 output:', output.substring(0, 200));
    }
    console.log('[db-init] Schema done via sqlite3 CLI.');
    return 0;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[db-init] sqlite3 CLI failed:', msg.substring(0, 200));
    return 999;
  }
}

// ── Find schema.sql ──
function findSchemaSql(): string | null {
  const candidates = [
    path.join(process.cwd(), 'scripts', 'schema.sql'),
    path.join(process.cwd(), '.next', 'server', 'scripts', 'schema.sql'),
    path.resolve('scripts', 'schema.sql'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ── Parse SQL: split on ; and strip comments ──
function parseStatements(sql: string): string[] {
  const raw = sql.split(';');
  const statements: string[] = [];
  for (const chunk of raw) {
    const cleaned = chunk
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .trim();
    if (
      cleaned.length > 0 &&
      cleaned.toUpperCase() !== 'BEGIN TRANSACTION' &&
      cleaned.toUpperCase() !== 'COMMIT'
    ) {
      statements.push(cleaned);
    }
  }
  return statements;
}

// ── 2. Seed admin & demo users ──
async function seedUsers() {
  try {
    // Super Admin
    const adminHash = await hash('QrDomotik2024!', 12);
    const admin = await db.user.upsert({
      where: { email: 'admin@qrdomotik.roomscan.pro' },
      update: {
        passwordHash: adminHash,
        fullName: 'Administrateur ORDOMOTIK',
        role: 'superadmin',
      },
      create: {
        email: 'admin@qrdomotik.roomscan.pro',
        fullName: 'Administrateur ORDOMOTIK',
        passwordHash: adminHash,
        role: 'superadmin',
      },
    });
    console.log('[db-init] Super Admin OK:', admin.email);

    const adminHomeCount = await db.home.count({
      where: { ownerId: admin.id },
    });
    if (adminHomeCount === 0) {
      await db.home.create({
        data: {
          name: 'ORDOMOTIK HQ',
          ownerId: admin.id,
          address: 'Siege Social',
        },
      });
      console.log('[db-init] Home ORDOMOTIK HQ created');
    }

    // Demo Client
    const demoHash = await hash('demo123', 12);
    const demo = await db.user.upsert({
      where: { email: 'demo@qrdomotik.roomscan.pro' },
      update: {
        passwordHash: demoHash,
        fullName: 'Utilisateur Demo',
        role: 'user',
      },
      create: {
        email: 'demo@qrdomotik.roomscan.pro',
        fullName: 'Utilisateur Demo',
        passwordHash: demoHash,
        role: 'user',
      },
    });
    console.log('[db-init] Demo Client OK:', demo.email);

    const demoHomeCount = await db.home.count({
      where: { ownerId: demo.id },
    });
    if (demoHomeCount === 0) {
      await db.home.create({
        data: { name: 'Ma Maison Demo', ownerId: demo.id, address: '' },
      });
      console.log('[db-init] Home Ma Maison Demo created');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[db-init] Seed error:', msg);
  }
}
