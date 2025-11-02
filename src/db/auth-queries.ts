import { eq } from 'drizzle-orm'
import { db } from './index'
import { users } from './schema'
import { hashPassword, verifyPassword } from '../lib/auth'

export interface CreateUserData {
  email: string
  password: string
  firstName?: string
  lastName?: string
  isAdmin?: boolean
}

export interface UpdateUserData {
  email?: string
  firstName?: string
  lastName?: string
  isAdmin?: boolean
  password?: string
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserData) {
  // Check if user already exists
  const existing = await getUserByEmail(data.email)
  if (existing) {
    throw new Error('User with this email already exists')
  }

  const passwordHash = await hashPassword(data.password)

  const [newUser] = await db
    .insert(users)
    .values({
      email: data.email,
      passwordHash,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      isAdmin: data.isAdmin || false,
    })
    .returning()

  // Don't return password hash
  const { passwordHash: _, ...userWithoutPassword } = newUser
  return userWithoutPassword
}

/**
 * Authenticate a user with email and password
 */
export async function authenticateUser(email: string, password: string) {
  const user = await getUserByEmail(email)
  if (!user) {
    throw new Error('Invalid email or password')
  }

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    throw new Error('Invalid email or password')
  }

  // Update last login
  await db
    .update(users)
    .set({ lastLogin: new Date() })
    .where(eq(users.id, user.id))

  // Don't return password hash
  const { passwordHash: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) return null

  // Don't return password hash
  const { passwordHash: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) return null
  return user;
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers() {
  const allUsers = await db.select().from(users).orderBy(users.createdAt)

  // Remove password hashes
  return allUsers.map(({ passwordHash: _, ...user }) => user)
}

/**
 * Update user information
 */
export async function updateUser(userId: number, data: UpdateUserData) {
  const updateData: any = {
    updatedAt: new Date(),
  }

  if (data.email !== undefined) {
    // Check if email is already taken by another user
    const existing = await getUserByEmail(data.email)
    if (existing && existing.id !== userId) {
      throw new Error('Email already in use')
    }
    updateData.email = data.email
  }

  if (data.firstName !== undefined) updateData.firstName = data.firstName
  if (data.lastName !== undefined) updateData.lastName = data.lastName
  if (data.isAdmin !== undefined) updateData.isAdmin = data.isAdmin

  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password)
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning()

  if (!updated) return null

  // Don't return password hash
  const { passwordHash: _, ...userWithoutPassword } = updated
  return userWithoutPassword
}

/**
 * Delete a user (admin only)
 */
export async function deleteUser(userId: number) {
  await db.delete(users).where(eq(users.id, userId))
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: number, isAdmin: boolean) {
  const [updated] = await db
    .update(users)
    .set({ isAdmin, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning()

  if (!updated) return null

  // Don't return password hash
  const { passwordHash: _, ...userWithoutPassword } = updated
  return userWithoutPassword
}

