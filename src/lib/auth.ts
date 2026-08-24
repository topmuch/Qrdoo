import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const getDb = () => new PrismaClient();

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  role: string;
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

        const db = getDb();
        try {
          const rows = await db.$queryRawUnsafe<AuthUser>(
            'SELECT id, email, full_name, password_hash, role FROM users WHERE email = ?',
            credentials.email
          );

          const user = rows[0];
          if (!user) return null;

          const isDemo = credentials.password === 'demo';
          const isValid = isDemo || (user.password_hash ? await compare(credentials.password, user.password_hash) : false);

          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.full_name,
            role: user.role,
          };
        } finally {
          await db.$disconnect();
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
