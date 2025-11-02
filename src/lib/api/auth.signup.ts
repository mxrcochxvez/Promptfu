import { createServerFn } from '@tanstack/react-start'
import { createUser } from '../../db/auth-queries'
import { generateToken } from '../auth'

const signupServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (data: {
      email: string
      password: string
      firstName?: string
      lastName?: string
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      const user = await createUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      })

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
        message: error instanceof Error ? error.message : 'Signup failed',
      }
    }
  })

export { signupServerFn }

