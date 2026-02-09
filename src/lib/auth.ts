import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import { verifyPassword } from './utils/password';
import { Role } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/welcome',
  },
  providers: [
    // Google OAuth Provider - only enabled if credentials are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
              },
            },
          }),
        ]
      : []),

    // Email & Password Provider
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        // Check if account is active
        if (!user.isActive) {
          throw new Error('Account is disabled');
        }

        // Verify password
        const isPasswordValid = await verifyPassword(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        // Check if email is verified (optional - can be enforced)
        // if (!user.emailVerified) {
        //   throw new Error('Please verify your email address');
        // }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign in
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // Create new user for Google OAuth
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              avatar: user.image,
              emailVerified: new Date(), // Auto-verify for OAuth
              googleId: account.providerAccountId,
              role: Role.USER,
            },
          });
        } else if (!existingUser.googleId) {
          // Link Google account to existing user
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              googleId: account.providerAccountId,
              emailVerified: existingUser.emailVerified || new Date(),
            },
          });
        }
      }

      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.email = session.email;
      }

      // Fetch fresh user data on each request to keep token updated
      if (token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatar: true,
            emailVerified: true,
            isActive: true,
          },
        });

        if (dbUser) {
          token.userId = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.role = dbUser.role;
          token.picture = dbUser.avatar;
          token.emailVerified = dbUser.emailVerified;
          token.isActive = dbUser.isActive;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as Role;
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.isActive = token.isActive as boolean;
      }

      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log sign in event
      console.log(`User signed in: ${user.email} via ${account?.provider}`);
    },
    async signOut({ token }) {
      // Clean up sessions when user signs out
      console.log(`User signed out: ${token.email}`);
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  debug: process.env.NODE_ENV === 'development',
};
