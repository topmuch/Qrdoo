import { execSync } from 'child_process'
import { existsSync, mkdirSync, appendFileSync, writeFileSync, chmodSync, accessSync, readFileSync, constants } from 'fs'
import { join, dirname } from 'path'

// =============================================================
// Runs at Next.js startup in standalone mode.
// Uses ONLY sqlite3 CLI — NO Prisma.
// Key: pipes SQL via Node.js stdin (not shell redirect)
// because shell < redirect fails in some Docker contexts.
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

/** Execute SQL via sqlite3, piping content via stdin (NO shell redirect) */
function execSql(dbPath: string, sql: string, label: string, timeout = 30000): string {
  const result = execSync(`/usr/bin/sqlite3 "${dbPath}"`, {
    input: sql,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout,
  })
  log(`${label} ✓`)
  return result
}

/** Find a SQL file by searching multiple possible locations */
function findSqlFile(filename: string): string | undefined {
  const dbDir = dirname(getDbPath())
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
    const sqliteVersion = execSync('/usr/bin/sqlite3 --version', { encoding: 'utf-8', stdio: 'pipe' }).trim()
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

    // CRITICAL: Create the DB file with Node.js FIRST.
    // Node.js can write here (proven), sqlite3 shell redirect cannot.
    // By pre-creating the file, sqlite3 just opens an existing file.
    if (!existsSync(dbPath)) {
      try {
        writeFileSync(dbPath, '')
        chmodSync(dbPath, 0o666)
        log(`DB file pre-created by Node.js ✓`)
      } catch (e) {
        log(`FATAL: Cannot create DB file: ${String(e).substring(0, 200)}`)
        return
      }
    } else {
      log(`DB file already exists`)
    }

    const schemaPath = findSqlFile('schema.sql')
    if (!schemaPath) {
      log(`WARN: schema.sql not found! Searched: /app/data, ${dataDir}, ${join(process.cwd(), 'data')}, /app/scripts, ${join(process.cwd(), 'scripts')}`)
      return
    }
    log(`Schema: ${schemaPath}`)

    // Read SQL with Node.js (proven to work) and pipe via stdin
    const schemaSql = readFileSync(schemaPath, 'utf-8')
    log(`Schema SQL: ${schemaSql.split('\n').length} lines, piping via stdin...`)
    execSql(dbPath, schemaSql, 'Schema applied')

    const seedPath = findSqlFile('seed-users.sql')
    if (seedPath) {
      log(`Seed: ${seedPath}`)
      const seedSql = readFileSync(seedPath, 'utf-8')
      execSql(dbPath, seedSql, 'Users seeded', 10000)
    } else {
      log('WARN: seed-users.sql not found')
    }

    // Verify
    const tables = execSync(`/usr/bin/sqlite3 "${dbPath}" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';"`, {
      encoding: 'utf-8', stdio: 'pipe',
    }).trim()
    log(`Tables: ${tables}`)

    const adminCheck = execSync(
      `/usr/bin/sqlite3 "${dbPath}" "SELECT email || '|' || role FROM users WHERE email='admin@qrdomotik.roomscan.pro';"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    ).trim()
    log(`Admin: ${adminCheck || 'NOT FOUND'}`)

    try { writeFileSync(LOG_FILE, `OK ${new Date().toISOString()} ${tables} tables\n`) } catch { /* ignore */ }
    log('=== Init Complete ===')
  } catch (err) {
    log(`FATAL: ${String(err).substring(0, 500)}`)
  }
}
