import { execSync } from 'child_process'
import { existsSync, mkdirSync, appendFileSync, writeFileSync, chmodSync, accessSync, readFileSync, unlinkSync, constants } from 'fs'
import { join, dirname } from 'path'

// =============================================================
// Runs at Next.js startup in standalone mode.
// Uses ONLY sqlite3 CLI — NO Prisma.
// 
// Key insight: in some Coolify/Docker contexts, the sqlite3 binary
// CANNOT write to certain paths (likely volume mount / seccomp issue)
// even though Node.js fs can. Solution: test sqlite3 write capability
// at each candidate path and use the first one that works.
// =============================================================

const LOG_FILE = '/tmp/ordomotik-init.log'

function log(msg: string) {
  const ts = new Date().toISOString()
  const line = `[${ts}] ${msg}\n`
  try { appendFileSync(LOG_FILE, line) } catch { /* ignore */ }
  console.log(`[db-init] ${msg}`)
}

/** Resolve the configured database file path */
function getConfiguredDbPath(): string {
  const envUrl = process.env.DATABASE_URL || ''
  if (envUrl.includes('://')) return envUrl.replace(/^file:\/\//, '/')
  if (envUrl.startsWith('file:')) {
    const rest = envUrl.replace(/^file:/, '')
    if (rest.startsWith('/')) return rest
    return join(process.cwd(), rest)
  }
  if (envUrl.startsWith('/')) return envUrl
  return join(process.cwd(), 'data', 'qrdomotik.db')
}

/** Test if sqlite3 binary can actually create/open a DB at a given path */
function testSqlite3Write(dir: string): boolean {
  try {
    mkdirSync(dir, { recursive: true })
    try { chmodSync(dir, 0o777) } catch { /* ignore */ }
    const testDb = join(dir, '.sqlite3-test')
    execSync(`/usr/bin/sqlite3 "${testDb}" "CREATE TABLE t(x); DROP TABLE t;"`, {
      stdio: 'pipe',
      timeout: 5000,
    })
    // Cleanup
    try { unlinkSync(testDb) } catch { /* ignore */ }
    return true
  } catch (e) {
    log(`sqlite3 write test FAILED at ${dir}: ${String(e).substring(0, 120)}`)
    return false
  }
}

/** Find the best DB path: configured path first, then fallbacks */
function findWorkingDbPath(): string | null {
  const configured = getConfiguredDbPath()
  const configuredDir = dirname(configured)
  const candidates = [
    { path: configured, label: 'configured' },
    { path: '/tmp/qrdomotik.db', label: '/tmp fallback' },
    { path: join(process.cwd(), 'qrdomotik.db'), label: 'cwd fallback' },
  ]

  for (const c of candidates) {
    const dir = dirname(c.path)
    log(`Testing sqlite3 at ${dir} (${c.label})...`)
    if (testSqlite3Write(dir)) {
      log(`sqlite3 works at ${dir} ✓ → using ${c.path}`)
      return c.path
    }
  }
  return null
}

/** Find a SQL file by searching multiple possible locations */
function findSqlFile(filename: string): string | undefined {
  const searchPaths = [
    '/app/data', '/app/scripts',
    join(process.cwd(), 'data'), join(process.cwd(), 'scripts'),
  ]
  for (const dir of searchPaths) {
    const candidate = join(dir, filename)
    if (existsSync(candidate)) return candidate
  }
  return undefined
}

/** Execute SQL by reading file in Node.js and piping via stdin to sqlite3 */
function execSqlFile(dbPath: string, sqlPath: string, label: string, timeout = 30000) {
  const sql = readFileSync(sqlPath, 'utf-8')
  execSync(`/usr/bin/sqlite3 "${dbPath}"`, {
    input: sql,
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout,
  })
  log(`${label} ✓`)
}

export async function register() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[db-init] Skipped (not production)')
    return
  }

  log('=== ORDOMOTIK Database Initialization ===')

  // Verify sqlite3 CLI exists
  try {
    const v = execSync('/usr/bin/sqlite3 --version', { encoding: 'utf-8', stdio: 'pipe' }).trim()
    log(`sqlite3: ${v}`)
  } catch (err) {
    log('FATAL: sqlite3 CLI not found')
    return
  }

  // Find a path where sqlite3 can actually create/open a database
  const dbPath = findWorkingDbPath()
  if (!dbPath) {
    log('FATAL: sqlite3 cannot write to ANY candidate path')
    return
  }

  // Store the working path so auth.ts can find it
  try {
    writeFileSync('/tmp/ordomotik-db-path', dbPath)
    log(`DB path saved to /tmp/ordomotik-db-path`)
  } catch { /* ignore */ }

  try {
    // Pre-create DB file with Node.js (belt and suspenders)
    if (!existsSync(dbPath)) {
      writeFileSync(dbPath, '')
      chmodSync(dbPath, 0o666)
      log(`DB file pre-created ✓`)
    } else {
      log(`DB file already exists (${dbPath})`)
    }

    // Find and apply schema
    const schemaPath = findSqlFile('schema.sql')
    if (!schemaPath) {
      log('WARN: schema.sql not found')
      return
    }
    log(`Schema: ${schemaPath}`)
    execSqlFile(dbPath, schemaPath, 'Schema applied')

    // Seed users
    const seedPath = findSqlFile('seed-users.sql')
    if (seedPath) {
      log(`Seed: ${seedPath}`)
      execSqlFile(dbPath, seedPath, 'Users seeded', 10000)
    } else {
      log('WARN: seed-users.sql not found')
    }

    // Verify
    const tables = execSync(`/usr/bin/sqlite3 "${dbPath}" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';"`, {
      encoding: 'utf-8', stdio: 'pipe',
    }).trim()
    log(`Tables: ${tables}`)

    const adminCheck = execSync(
      `/usr/bin/sqlite3 "${dbPath}" "SELECT email||'|'||role FROM users WHERE email='admin@qrdomotik.roomscan.pro';"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    ).trim()
    log(`Admin: ${adminCheck || 'NOT FOUND'}`)

    log('=== Init Complete ===')
  } catch (err) {
    log(`FATAL: ${String(err).substring(0, 500)}`)
  }
}
