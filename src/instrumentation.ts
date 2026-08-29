import { execSync } from 'child_process'
import { existsSync, mkdirSync, appendFileSync, writeFileSync, chmodSync, accessSync, constants } from 'fs'
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

/** Ensure the data directory exists AND is writable */
function ensureDataDir(dir: string): boolean {
  try {
    mkdirSync(dir, { recursive: true })
  } catch (e) {
    log(`mkdir failed for ${dir}: ${String(e).substring(0, 100)}`)
  }

  // Verify write access
  try {
    accessSync(dir, constants.W_OK)
    return true
  } catch {
    log(`No write access to ${dir} — attempting chmod 777`)
    try {
      chmodSync(dir, 0o777)
      accessSync(dir, constants.W_OK)
      log(`chmod 777 succeeded for ${dir}`)
      return true
    } catch (e2) {
      log(`FATAL: Cannot make ${dir} writable: ${String(e2).substring(0, 100)}`)
      return false
    }
  }
}

/** Find a SQL file by searching multiple possible locations */
function findSqlFile(filename: string): string | undefined {
  const dbDir = dirname(getDbPath())
  // Order matters: prefer /app/data (Dockerfile copies here)
  const searchPaths = [
    '/app/data',
    dbDir,
    join(process.cwd(), 'data'),
    '/app/scripts',
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
    const dirOk = ensureDataDir(dataDir)
    if (!dirOk) {
      log('FATAL: Data directory not writable, aborting')
      return
    }
    log(`Data directory: ${dataDir} (writable ✓)`)

    // Verify write by touching a temp file
    try {
      const testFile = join(dataDir, '.write-test')
      writeFileSync(testFile, 'ok')
      // Keep the file as proof of write access
    } catch (e) {
      log(`FATAL: Write test failed: ${String(e).substring(0, 100)}`)
      return
    }

    const schemaPath = findSqlFile('schema.sql')
    if (!schemaPath) {
      log(`WARN: schema.sql not found! Searched: /app/data, ${dirname(dbPath)}, ${join(process.cwd(), 'data')}, /app/scripts, ${join(process.cwd(), 'scripts')}`)
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
