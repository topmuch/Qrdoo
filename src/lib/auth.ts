import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, chmodSync, accessSync, readFileSync, writeFileSync, constants } from 'fs';
import { join, dirname } from 'path';

// =============================================================
// NO PRISMA IN AUTH - uses sqlite3 CLI exclusively.
// Pipes SQL via Node.js stdin (not shell redirect)
// because shell < redirect fails in some Docker contexts.
// =============================================================

let _schemaReady = false;

/** Resolve the actual database file path (works in any CWD) */
function getDbPath(): string {
  const envUrl = process.env.DATABASE_URL || '';
  if (envUrl.includes('://')) {
    return envUrl.replace(/^file:\/\//, '/');
  }
  if (envUrl.startsWith('file:')) {
    const rest = envUrl.replace(/^file:/, '');
    if (rest.startsWith('/')) return rest;
    return join(process.cwd(), rest);
  }
  if (envUrl.startsWith('/')) return envUrl;
  return join(process.cwd(), 'data', 'qrdomotik.db');
}

/** Ensure the data directory exists AND is writable */
function ensureDataDir(dir: string): boolean {
  try {
    mkdirSync(dir, { recursive: true });
  } catch { /* ignore */ }
  try {
    accessSync(dir, constants.W_OK);
    return true;
  } catch {
    try {
      chmodSync(dir, 0o777);
      accessSync(dir, constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
}

function ensureSchemaAndUsers() {
  if (_schemaReady) return;
  _schemaReady = true;

  try {
    const dbPath = getDbPath();
    const dataDir = dirname(dbPath);

    if (!ensureDataDir(dataDir)) {
      console.error('[auth-init] FATAL: Data directory not writable:', dataDir);
      return;
    }

    // Pre-create DB file with Node.js (proven to work when shell redirect fails)
    if (!existsSync(dbPath)) {
      try {
        writeFileSync(dbPath, '');
        chmodSync(dbPath, 0o666);
      } catch { /* instrumentation may have done it already */ }
    }

    // Find SQL files — prefer /app/data (Dockerfile copies here)
    const sqlSearchPaths = [
      '/app/data',
      dataDir,
      join(process.cwd(), 'data'),
      '/app/scripts',
      join(process.cwd(), 'scripts'),
    ];
    let schemaPath: string | undefined;
    let seedPath: string | undefined;

    for (const dir of sqlSearchPaths) {
      const candidate = join(dir, 'schema.sql');
      if (!schemaPath && existsSync(candidate)) schemaPath = candidate;
      const seedCandidate = join(dir, 'seed-users.sql');
      if (!seedPath && existsSync(seedCandidate)) seedPath = seedCandidate;
    }

    if (schemaPath) {
      // Read SQL with Node.js and pipe via stdin (no shell redirect)
      const schemaSql = readFileSync(schemaPath, 'utf-8');
      execSync(`/usr/bin/sqlite3 "${dbPath}"`, { input: schemaSql, stdio: ['pipe', 'pipe', 'pipe'] });
      console.log('[auth-init] Schema OK');
    } else {
      console.error('[auth-init] WARN: schema.sql not found in:', sqlSearchPaths.join(', '));
    }

    if (seedPath) {
      const seedSql = readFileSync(seedPath, 'utf-8');
      execSync(`/usr/bin/sqlite3 "${dbPath}"`, { input: seedSql, stdio: ['pipe', 'pipe', 'pipe'] });
      console.log('[auth-init] Users seeded');
    }
  } catch (err) {
    console.error('[auth-init] FAILED:', String(err).substring(0, 300));
  }
}

/** Query a user by email using sqlite3 CLI */
function queryUserByEmail(email: string): { id: string; email: string; full_name: string; password_hash: string; role: string } | null {
  try {
    const dbPath = getDbPath();
    if (!existsSync(dbPath)) {
      console.error('[auth] DB file not found:', dbPath);
      return null;
    }
    const sql = `SELECT id, email, full_name, password_hash, role FROM users WHERE email = '${email.replace(/'/g, "''")}' LIMIT 1;`;
    const result = execSync(`/usr/bin/sqlite3 -json "${dbPath}" "${sql}"`, { encoding: 'utf-8', stdio: 'pipe' });
    const rows = JSON.parse(result);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error('[auth] queryUserByEmail error:', String(err).substring(0, 200));
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // 1. Ensure DB is initialized (sqlite3 CLI)
          ensureSchemaAndUsers();

          // 2. Query user via sqlite3 CLI (NO Prisma)
          const user = queryUserByEmail(credentials.email);
          if (!user) {
            console.log('[auth] User not found:', credentials.email);
            return null;
          }

          // 3. Verify password with bcryptjs
          const hash = user.password_hash || '';
          if (!hash) {
            console.error('[auth] User has no password hash:', credentials.email);
            return null;
          }

          const isValid = await compare(credentials.password, hash);
          if (!isValid) {
            console.log('[auth] Invalid password for:', credentials.email);
            return null;
          }

          console.log('[auth] Login OK:', credentials.email, 'role:', user.role);
          return {
            id: user.id,
            email: user.email,
            name: user.full_name,
            role: user.role,
          };
        } catch (err) {
          console.error('[auth] authorize() error:', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
