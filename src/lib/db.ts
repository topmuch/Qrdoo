import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

// =============================================================
// DB Init: sqlite3 CLI schema creation (production Docker only)
// Runs once at module load — db.ts is imported by ALL server code
// =============================================================
let _dbInitDone = false

function ensureSchema() {
  if (_dbInitDone || process.env.NODE_ENV !== 'production') return
  _dbInitDone = true

  try {
    // Derive DB path from DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || 'file:/app/data/qrdomotik.db'
    const dbPath = dbUrl.includes('://')
      ? dbUrl.replace(/^file:\/\//, '/')
      : join(process.cwd(), dbUrl.replace(/^file:/, ''))

    mkdirSync(dirname(dbPath), { recursive: true })

    // Find schema.sql
    const candidates = [
      join(dirname(dbPath), 'schema.sql'),
      '/app/data/schema.sql',
      '/app/scripts/schema.sql',
      join(process.cwd(), 'scripts', 'schema.sql'),
    ]
    const schemaPath = candidates.find(p => existsSync(p))
    const seedPath = candidates.find(p => existsSync(p.replace('schema.sql', 'seed-users.sql')))

    if (!schemaPath) {
      console.error('[db-init] schema.sql not found')
      return
    }

    // Create tables
    execSync(`sqlite3 "${dbPath}" < "${schemaPath}"`, { stdio: 'pipe' })
    console.log('[db-init] Schema OK')

    // Seed users
    if (seedPath) {
      execSync(`sqlite3 "${dbPath}" < "${seedPath}"`, { stdio: 'pipe' })
      console.log('[db-init] Users seeded')
    }
  } catch (err) {
    console.error('[db-init] Failed:', String(err).substring(0, 200))
  }
}

// Run BEFORE creating PrismaClient
ensureSchema()

// =============================================================
// Prisma Client
// =============================================================
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
