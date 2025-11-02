import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUserByEmail, updateUserRole } from '../db/auth-queries'

const setupAdminFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const user = await getUserByEmail(data.email)
    if (!user) {
      throw new Error('User not found')
    }
    
    await updateUserRole(user.id, true)
    return { success: true, message: `User ${data.email} has been granted admin access` }
  })

export const Route = createFileRoute('/setup-admin')({
  component: SetupAdmin,
})

function SetupAdmin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      const result = await setupAdminFn({ data: { email } })
      if (result.success) {
        setMessage(result.message || 'Admin access granted successfully!')
        // If updating current user, refresh token by logging out and back in
        if (user?.email === email) {
          setTimeout(() => {
            navigate({ to: '/dashboard' })
            window.location.reload()
          }, 2000)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant admin access')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Setup Admin Access</h1>
        <p className="text-gray-400 mb-6 text-sm">
          This is a one-time setup route. Grant admin access to a user by entering their email.
        </p>

        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={user?.email || 'user@example.com'}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {message && (
            <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Granting Access...' : 'Grant Admin Access'}
          </button>
        </form>

        <p className="text-gray-500 text-xs mt-6 text-center">
          After granting access, log out and log back in if you granted access to your own account.
        </p>
      </div>
    </div>
  )
}

