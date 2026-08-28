import { NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

function getDb() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

export async function GET() {
  const isDev = process.env.NODE_ENV !== 'production';
  const dbUrl = process.env.DATABASE_URL || 'file:/app/data/qrdomotik.db';
  const dbPath = dbUrl.replace(/^file:\/\//, '/');

  // Check schema.sql existence
  const prodSchemaPath = '/app/data/schema.sql';
  const devSchemaPath = './scripts/schema.sql';
  const schemaPath = isDev ? devSchemaPath : prodSchemaPath;
  const schemaExists = existsSync(schemaPath);

  // Check database file existence
  const dbExists = existsSync(dbPath);

  // Count tables
  let tableCount = 0;
  let users: { email: string; role: string }[] = [];

  try {
    const db = getDb();
    const tables = await db.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    tableCount = Array.isArray(tables) ? tables.length : 0;

    const rows = await db.user.findMany({ select: { email: true, role: true } });
    users = rows.map((r: { email: string; role: string }) => ({ email: r.email, role: r.role }));
  } catch (err) {
    console.error('[debug/db]', err);
  }

  // Check instrumentation ran
  let initRan = false;
  let initLog = '';
  if (existsSync('/app/data/.init-done')) {
    initRan = true;
    initLog = readFileSync('/app/data/.init-done', 'utf-8').trim();
  } else if (existsSync('/app/data/init.log')) {
    initRan = true;
    initLog = readFileSync('/app/data/init.log', 'utf-8').trim();
  }

  return NextResponse.json({
    environment: isDev ? 'development' : 'production',
    schemaPath,
    schemaExists,
    dbPath,
    dbExists,
    tableCount,
    users,
    initRan,
    initLog,
  });
}
