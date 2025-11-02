import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: number
  email: string
  isAdmin: boolean
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

/**
 * Get user from request (checks Authorization header or cookie)
 */
export function getUserFromRequest(request: Request): JWTPayload | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader)
  
  if (token) {
    return verifyToken(token)
  }

  // Try cookie (for browser requests)
  const cookies = request.headers.get('cookie')
  if (cookies) {
    const cookieMatch = cookies.match(/auth_token=([^;]+)/)
    if (cookieMatch && cookieMatch[1]) {
      return verifyToken(cookieMatch[1])
    }
  }

  return null
}

/**
 * Require admin access - verifies user is admin from request
 * Throws error if user is not authenticated or not admin
 */
export function requireAdmin(request: Request): JWTPayload {
  const user = getUserFromRequest(request)
  
  if (!user) {
    throw new Error('Unauthorized: Authentication required')
  }
  
  if (!user.isAdmin) {
    throw new Error('Forbidden: Admin access required')
  }
  
  return user
}

/**
 * Get request from TanStack Start server function context
 * This is a helper to extract request from the handler context if available
 */
export function getRequestFromContext(context: any): Request | null {
  // TanStack Start may provide request through context.request or context.event.request
  if (context?.request) return context.request
  if (context?.event?.request) return context.event.request
  // Try accessing through global if available (some frameworks provide this)
  if (typeof globalThis !== 'undefined' && (globalThis as any).request) {
    return (globalThis as any).request
  }
  return null
}

/**
 * Helper to verify admin from token string directly
 * Used when Request object is not available (e.g., TanStack Start server functions)
 */
export function requireAdminFromToken(token: string | null): JWTPayload {
  if (!token) {
    throw new Error('Unauthorized: Authentication required')
  }
  
  const user = verifyToken(token)
  if (!user) {
    throw new Error('Unauthorized: Invalid token')
  }
  
  if (!user.isAdmin) {
    throw new Error('Forbidden: Admin access required')
  }
  
  return user
}

