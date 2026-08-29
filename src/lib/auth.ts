import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';

// =============================================================
// NO PRISMA IN AUTH - uses sqlite3 CLI exclusively.
// Prisma 6.19.2 cannot parse connection strings in standalone mode.
// sqlite3 CLI is proven to work (see instrumentation.ts logs).
// =============================================================

let _schemaReady = false;

/** Resolve the actual database file path (works in any CWD) */
function getDbPath(): string {
  // In Docker: /app/data/qrdomotik.db
  // In dev: <project>/data/qrdomotik.db
  const envUrl = process.env.DATABASE_URL || '';
  if (envUrl.includes('://')) {
    // file:///path → /path
    return envUrl.replace(/^file:\/\//, '/');
  }
  if (envUrl.startsWith('file:')) {
    // file:/path → /path  OR  file:./path → resolve from CWD
    const rest = envUrl.replace(/^file:/, '');
    if (rest.startsWith('/')) return rest;
    return join(process.cwd(), rest);
  }
  // Bare path or relative
  if (envUrl.startsWith('/')) return envUrl;
  return join(process.cwd(), 'data', 'qrdomotik.db');
}

function ensureSchemaAndUsers() {
  if (_schemaReady) return;
  _schemaReady = true;

  try {
    const dbPath = getDbPath();
    mkdirSync(dirname(dbPath), { recursive: true });

    // Find SQL files - check multiple locations for Docker / dev / standalone
    const sqlSearchPaths = [
      '/app/data',
      '/app/scripts',
      join(process.cwd(), 'data'),
      join(process.cwd(), 'scripts'),
      join(dirname(getDbPath())),  // same dir as DB file
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
      execSync(`sqlite3 "${dbPath}" < "${schemaPath}"`, { stdio: 'pipe' });
      console.log('[auth-init] Schema OK');
    } else {
      console.error('[auth-init] WARN: schema.sql not found in:', sqlSearchPaths.join(', '));
    }

    if (seedPath) {
      execSync(`sqlite3 "${dbPath}" < "${seedPath}"`, { stdio: 'pipe' });
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
    const result = execSync(`sqlite3 -json "${dbPath}" "${sql}"`, { encoding: 'utf-8', stdio: 'pipe' });
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
