import { createServerFn } from '@tanstack/react-start'
import { verifyToken } from '../auth'
import { getUserById } from '../../db/auth-queries'

const verifyServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: string) => data)
  .handler(async ({ data: token }) => {
    try {
      const payload = verifyToken(token)
      if (!payload) {
        return {
          success: false,
          message: 'Invalid or missing token',
        }
      }

      const user = await getUserById(payload.userId)
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        }
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLogin: user.lastLogin,
        },
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Verification failed',
      }
    }
  })

export { verifyServerFn }

