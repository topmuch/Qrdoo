import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { PrismaClient } from '@prisma/client';

// =============================================================
// DB Init: runs inside authorize() — guaranteed to execute
// Uses sqlite3 CLI + pre-hashed passwords (no Prisma needed)
// =============================================================
let _schemaReady = false;

function ensureSchemaAndUsers() {
  if (_schemaReady) return;
  _schemaReady = true;

  try {
    const dbUrl = process.env.DATABASE_URL || 'file:/app/data/qrdomotik.db';
    const dbPath = dbUrl.replace(/^file:\/\//, '/');

    mkdirSync(dirname(dbPath), { recursive: true });

    // Find SQL files
    const paths = [
      '/app/data/schema.sql',
      '/app/scripts/schema.sql',
      join(process.cwd(), 'scripts', 'schema.sql'),
      join(process.cwd(), 'data', 'schema.sql'),
    ];
    const schemaPath = paths.find(p => existsSync(p));
    const seedPath = paths.find(p => existsSync(p.replace('schema.sql', 'seed-users.sql')));

    if (schemaPath) {
      execSync(`sqlite3 "${dbPath}" < "${schemaPath}"`, { stdio: 'pipe' });
      console.log('[auth-init] Schema OK');
    }

    if (seedPath) {
      execSync(`sqlite3 "${dbPath}" < "${seedPath}"`, { stdio: 'pipe' });
      console.log('[auth-init] Users seeded');
    }

    // Write marker file for debugging
    writeFileSync('/app/data/.init-done', new Date().toISOString());
  } catch (err) {
    console.error('[auth-init] FAILED:', String(err).substring(0, 300));
  }
}

// =============================================================
// Prisma Client (lazy, created after schema is ready)
// =============================================================
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

function getDb() {
  ensureSchemaAndUsers();
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({ log: ['query'] });
  }
  return globalForPrisma.prisma;
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
          const db = getDb();
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) return null;

          const hash = user.passwordHash || '';
          if (!hash) return null;

          const isValid = await compare(credentials.password, hash);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
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
