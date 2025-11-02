import { createServerFn } from '@tanstack/react-start'

const logoutServerFn = createServerFn({
  method: 'POST',
}).handler(async () => {
  // Logout is handled client-side by removing the token
  // This endpoint can be used for server-side cleanup if needed
  return {
    success: true,
    message: 'Logged out successfully',
  }
})

export { logoutServerFn }

