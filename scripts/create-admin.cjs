// =============================================================
// ORDOMOTIK - Seed: init DB + create/update admin & demo users
// Auto-runs on every container start (Dockerfile CMD)
// Creates tables from schema.sql if they don't exist
// =============================================================

const fs = require('fs');
const path = require('path');
const { hash } = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ── Check if tables exist ──
async function tablesExist() {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name='users'`
    );
    return result[0].c > 0;
  } catch {
    return false;
  }
}

// ── Execute schema SQL file to create all tables ──
async function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('[seed] schema.sql not found at', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf-8');
  // Split on semicolons, filter empty, skip pragmas
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s.toUpperCase() !== 'BEGIN TRANSACTION' && s.toUpperCase() !== 'COMMIT');

  // Disable FK checks during schema creation
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys=OFF;');

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (err) {
      // Ignore "already exists" errors
      if (!err.message?.includes('already exists')) {
        console.error(`[seed] SQL error on statement ${i + 1}:`, err.message);
      }
    }
  }

  await prisma.$executeRawUnsafe('PRAGMA foreign_keys=ON;');
  console.log(`[seed] Schema initialized (${statements.length} statements)`);
}

// ── Seed users ──
async function seedUsers() {
  // Super Admin
  const adminHash = await hash('QrDomotik2024!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@qrdomotik.roomscan.pro' },
    update: { passwordHash: adminHash, fullName: 'Administrateur ORDOMOTIK', role: 'superadmin' },
    create: {
      email: 'admin@qrdomotik.roomscan.pro',
      fullName: 'Administrateur ORDOMOTIK',
      passwordHash: adminHash,
      role: 'superadmin',
    },
  });
  console.log('[seed] Super Admin OK:', admin.email);

  const adminHomeCount = await prisma.home.count({ where: { ownerId: admin.id } });
  if (adminHomeCount === 0) {
    await prisma.home.create({ data: { name: 'ORDOMOTIK HQ', ownerId: admin.id, address: 'Siege Social' } });
    console.log('[seed] Home ORDOMOTIK HQ created');
  }

  // Demo Client
  const demoHash = await hash('demo123', 12);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@qrdomotik.roomscan.pro' },
    update: { passwordHash: demoHash, fullName: 'Utilisateur Demo', role: 'user' },
    create: {
      email: 'demo@qrdomotik.roomscan.pro',
      fullName: 'Utilisateur Demo',
      passwordHash: demoHash,
      role: 'user',
    },
  });
  console.log('[seed] Demo Client OK:', demo.email);

  const demoHomeCount = await prisma.home.count({ where: { ownerId: demo.id } });
  if (demoHomeCount === 0) {
    await prisma.home.create({ data: { name: 'Ma Maison Demo', ownerId: demo.id, address: '' } });
    console.log('[seed] Home Ma Maison Demo created');
  }
}

// ── Main ──
async function main() {
  try {
    const exists = await tablesExist();
    if (!exists) {
      console.log('[seed] No tables found, initializing schema...');
      await initSchema();
    } else {
      console.log('[seed] Tables already exist, skipping schema init.');
    }
    await seedUsers();
    console.log('[seed] Done.');
  } catch (err) {
    console.error('[seed] Fatal error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
