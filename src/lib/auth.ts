import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('No user found with this email')
        }

        if (!user.isActive) {
          throw new Error('Account is deactivated')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign in, set user data
      if (user) {
        token.id = user.id
        token.role = user.role
        token.username = user.username
      }

      // Refresh user data from database periodically (every 5 minutes)
      // This ensures JWT reflects database changes without requiring logout
      const shouldRefresh = !token.lastRefresh ||
        (Date.now() - (token.lastRefresh as number)) > 5 * 60 * 1000

      if (shouldRefresh && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              username: true,
              role: true,
              avatar: true,
              isActive: true,
            },
          })

          if (dbUser && dbUser.isActive) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.username = dbUser.username
            token.email = dbUser.email
            token.avatar = dbUser.avatar
            token.lastRefresh = Date.now()
          } else if (!dbUser?.isActive) {
            // User is deactivated, invalidate token
            return null as any
          }
        } catch (error) {
          console.error('Error refreshing user data:', error)
          // Continue with existing token if refresh fails
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.username = token.username as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
