import { execSync } from 'child_process'
import { existsSync, mkdirSync, appendFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'

// =============================================================
// Runs at Next.js startup in standalone mode.
// Uses ONLY sqlite3 CLI — NO Prisma.
// =============================================================

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

/** Resolve the actual database file path (works in any CWD including standalone) */
function getDbPath(): string {
  const envUrl = process.env.DATABASE_URL || ''
  if (envUrl.includes('://')) {
    return envUrl.replace(/^file:\/\//, '/')
  }
  if (envUrl.startsWith('file:')) {
    const rest = envUrl.replace(/^file:/, '')
    if (rest.startsWith('/')) return rest
    return join(process.cwd(), rest)
  }
  if (envUrl.startsWith('/')) return envUrl
  return join(process.cwd(), 'data', 'qrdomotik.db')
}

/** Find a SQL file by searching multiple possible locations */
function findSqlFile(filename: string): string | undefined {
  const dbDir = dirname(getDbPath())
  const searchPaths = [
    '/app/data',
    '/app/scripts',
    dbDir,
    join(process.cwd(), 'data'),
    join(process.cwd(), 'scripts'),
  ]
  for (const dir of searchPaths) {
    const candidate = join(dir, filename)
    if (existsSync(candidate)) return candidate
  }
  return undefined
}

export async function register() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[db-init] Skipped (not production)')
    return
  }

  log('=== ORDOMOTIK Database Initialization ===')

  try {
    const sqliteVersion = execSync('sqlite3 --version', { encoding: 'utf-8', stdio: 'pipe' }).trim()
    log(`sqlite3 available: ${sqliteVersion}`)
  } catch (err) {
    log('FATAL: sqlite3 CLI not found!')
    log(`Error: ${String(err).substring(0, 200)}`)
    return
  }

  try {
    const dbPath = getDbPath()
    log(`Database path: ${dbPath}`)

    const dataDir = dirname(dbPath)
    mkdirSync(dataDir, { recursive: true })
    log(`Data directory: ${dataDir}`)

    const schemaPath = findSqlFile('schema.sql')
    if (!schemaPath) {
      log(`WARN: schema.sql not found! Searched: /app/data, /app/scripts, ${dirname(dbPath)}, ${join(process.cwd(), 'data')}, ${join(process.cwd(), 'scripts')}`)
      return
    }
    log(`Schema: ${schemaPath}`)

    log('Applying schema...')
    execSync(`sqlite3 "${dbPath}" < "${schemaPath}" 2>&1`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 30000,
    })
    log('Schema applied ✓')

    const seedPath = findSqlFile('seed-users.sql')
    if (seedPath) {
      log(`Seed: ${seedPath}`)
      execSync(`sqlite3 "${dbPath}" < "${seedPath}" 2>&1`, {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 10000,
      })
      log('Users seeded ✓')
    } else {
      log('WARN: seed-users.sql not found')
    }

    // Verify
    const tables = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';"`, {
      encoding: 'utf-8', stdio: 'pipe',
    }).trim()
    log(`Tables: ${tables}`)

    const adminCheck = execSync(
      `sqlite3 "${dbPath}" "SELECT email || '|' || role FROM users WHERE email='admin@qrdomotik.roomscan.pro';"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    ).trim()
    log(`Admin: ${adminCheck || 'NOT FOUND'}`)

    try { writeFileSync(LOG_FILE, `OK ${new Date().toISOString()} ${tables} tables\n`) } catch { /* ignore */ }
    log('=== Init Complete ===')
  } catch (err) {
    log(`FATAL: ${String(err).substring(0, 500)}`)
  }
}
