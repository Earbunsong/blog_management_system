import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'
import prisma from './prisma'
import { UserRole } from '@prisma/client'

/**
 * Authorization middleware that validates user permissions
 * Best Practice: Always check database for current user role on critical operations
 * This ensures role changes take effect immediately without requiring logout
 */

interface AuthUser {
  id: string
  email: string
  username: string
  role: UserRole
}

export interface AuthResult {
  authorized: boolean
  user?: AuthUser
  error?: string
}

/**
 * Check if user is authenticated and has required role
 * @param requiredRoles - Array of roles that are allowed to access the resource
 * @param checkDatabase - If true, validates role against database (recommended for critical operations)
 */
export async function authorizeUser(
  requiredRoles: UserRole[],
  checkDatabase: boolean = true
): Promise<AuthResult> {
  try {
    // Get session from JWT
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return {
        authorized: false,
        error: 'Not authenticated',
      }
    }

    // If checkDatabase is true, get fresh user data from database
    // This is best practice for authorization checks
    if (checkDatabase) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
        },
      })

      if (!dbUser) {
        return {
          authorized: false,
          error: 'User not found',
        }
      }

      if (!dbUser.isActive) {
        return {
          authorized: false,
          error: 'Account is deactivated',
        }
      }

      // Check if user has required role
      if (!requiredRoles.includes(dbUser.role)) {
        return {
          authorized: false,
          error: 'Insufficient permissions',
        }
      }

      return {
        authorized: true,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          username: dbUser.username,
          role: dbUser.role,
        },
      }
    }

    // Fallback to JWT role (faster but not real-time)
    const userRole = session.user.role as UserRole

    if (!requiredRoles.includes(userRole)) {
      return {
        authorized: false,
        error: 'Insufficient permissions',
      }
    }

    return {
      authorized: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username,
        role: userRole,
      },
    }
  } catch (error) {
    console.error('Authorization error:', error)
    return {
      authorized: false,
      error: 'Authorization check failed',
    }
  }
}

/**
 * Shorthand helper for admin-only authorization
 */
export async function requireAdmin(): Promise<AuthResult> {
  return authorizeUser([UserRole.ADMIN], true)
}

/**
 * Shorthand helper for editor and above
 */
export async function requireEditor(): Promise<AuthResult> {
  return authorizeUser([UserRole.ADMIN, UserRole.EDITOR], true)
}

/**
 * Shorthand helper for author and above
 */
export async function requireAuthor(): Promise<AuthResult> {
  return authorizeUser([UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR], true)
}

/**
 * Helper to return unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Helper to return forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Check if user can modify a resource (owner or admin/editor)
 * @param resourceOwnerId - The ID of the user who owns the resource
 * @param userId - The current user's ID
 * @param userRole - The current user's role
 */
export function canModifyResource(
  resourceOwnerId: string,
  userId: string,
  userRole: UserRole
): boolean {
  // User is the owner
  if (resourceOwnerId === userId) {
    return true
  }

  // User is admin or editor
  if (userRole === UserRole.ADMIN || userRole === UserRole.EDITOR) {
    return true
  }

  return false
}
