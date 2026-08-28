import { execSync } from 'child_process'
import { existsSync, mkdirSync, appendFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'

// IMPORTANT: This file runs at Next.js startup in standalone mode.
// It uses ONLY sqlite3 CLI — NO Prisma imports (Prisma can't connect at Docker startup).
// Coolify cannot override instrumentation.ts (it overrides CMD, not the Node.js process internals).

const LOG_FILE = '/app/data/init.log'

function log(msg: string) {
  const ts = new Date().toISOString()
  const line = `[${ts}] ${msg}\n`
  try {
    if (existsSync(dirname(LOG_FILE))) {
      appendFileSync(LOG_FILE, line)
    }
  } catch { /* ignore */ }
  console.log(`[db-init] ${msg}`)
}

export async function register() {
  // Only run in production (standalone/Docker)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[db-init] Skipped (not production)')
    return
  }

  log('=== ORDOMOTIK Database Initialization ===')

  try {
    // 1. Verify sqlite3 CLI is available
    const sqliteVersion = execSync('sqlite3 --version', { encoding: 'utf-8', stdio: 'pipe' }).trim()
    log(`sqlite3 available: ${sqliteVersion}`)
  } catch (err) {
    log('FATAL: sqlite3 CLI not found! Database cannot be initialized.')
    log(`Error: ${String(err).substring(0, 200)}`)
    return
  }

  try {
    // 2. Resolve database path from DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || 'file:/app/data/qrdomotik.db'
    let dbPath: string
    if (dbUrl.includes('://')) {
      dbPath = dbUrl.replace(/^file:\/\//, '/')
    } else {
      dbPath = join(process.cwd(), dbUrl.replace(/^file:/, ''))
    }
    log(`Database path: ${dbPath}`)

    // 3. Ensure data directory exists
    const dataDir = dirname(dbPath)
    mkdirSync(dataDir, { recursive: true })
    log(`Data directory ready: ${dataDir}`)

    // 4. Find SQL files (search multiple possible locations)
    const candidates = [
      '/app/data/schema.sql',        // Docker COPY target (primary)
      '/app/scripts/schema.sql',      // Alternative
      join(process.cwd(), 'data', 'schema.sql'),
      join(process.cwd(), 'scripts', 'schema.sql'),
    ]
    const schemaPath = candidates.find(p => existsSync(p))
    if (!schemaPath) {
      log(`WARN: schema.sql not found. Searched: ${candidates.join(', ')}`)
      // Try to find any .sql file
      return
    }
    log(`Schema file: ${schemaPath}`)

    // 5. Apply schema (CREATE TABLE IF NOT EXISTS is idempotent)
    log('Applying schema...')
    const schemaResult = execSync(`sqlite3 "${dbPath}" < "${schemaPath}" 2>&1`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 30000,
    })
    if (schemaResult.trim()) {
      log(`Schema output: ${schemaResult.trim().substring(0, 300)}`)
    }
    log('Schema applied successfully ✓')

    // 6. Apply seed users (INSERT OR IGNORE is idempotent)
    const seedPath = schemaPath.replace('schema.sql', 'seed-users.sql')
    if (existsSync(seedPath)) {
      log(`Seed file: ${seedPath}`)
      const seedResult = execSync(`sqlite3 "${dbPath}" < "${seedPath}" 2>&1`, {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 10000,
      })
      if (seedResult.trim()) {
        log(`Seed output: ${seedResult.trim().substring(0, 300)}`)
      }
      log('Users seeded successfully ✓')
    } else {
      log(`WARN: seed-users.sql not found at ${seedPath}`)
    }

    // 7. Verify tables exist
    const tables = execSync(`sqlite3 "${dbPath}" "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim()
    log(`Tables created: ${tables.split('\n').length} tables`) 
    log(`Table names: ${tables.substring(0, 200)}`)

    // 8. Verify admin user exists
    const adminCheck = execSync(
      `sqlite3 "${dbPath}" "SELECT email, role FROM users WHERE email='admin@qrdomotik.roomscan.pro';"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    ).trim()
    log(`Admin user: ${adminCheck || 'NOT FOUND!'}`)

    // 9. Write init log to file for debugging
    try {
      writeFileSync(LOG_FILE, `Last init: ${new Date().toISOString()}
Tables: ${tables.split('\n').length}\n`, 'utf-8')
    } catch { /* ignore */ }

    log('=== Database Initialization Complete ===')

  } catch (err) {
    log(`FATAL ERROR: ${String(err).substring(0, 500)}`)
    log('Database may not be initialized properly!')
  }
}
