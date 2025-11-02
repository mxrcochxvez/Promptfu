import { createServerFn } from '@tanstack/react-start'
import { authenticateUser } from '../db/auth-queries'
import { generateToken } from '../lib/auth'

const loginServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    try {
      const user = await authenticateUser(data.email, data.password)
      const token = generateToken({
        userId: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      })

      return {
        success: true,
        token,
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
        message: error instanceof Error ? error.message : 'Login failed',
      }
    }
  })

export { loginServerFn }

