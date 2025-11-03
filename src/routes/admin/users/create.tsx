import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { createUser } from '../../../db/auth-queries'
import { UserPlus, ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'

const createUserServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (data: {
      email: string
      password: string
      firstName?: string
      lastName?: string
      isAdmin?: boolean
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      const user = await createUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        isAdmin: data.isAdmin || false,
      })
      return { success: true, user }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create user',
      }
    }
  })

export const Route = createFileRoute('/admin/users/create')({
  component: CreateUserPage,
})

function CreateUserPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate({ to: '/dashboard' })
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await createUserServerFn({
        data: {
          email,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          isAdmin,
        },
      })

      if (result.success) {
        navigate({ to: '/admin/users' })
      } else {
        setError(result.message || 'Failed to create user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-8 px-4 md:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 text-accent-500 hover:text-accent-400 mb-4 transition-colors duration-200 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-olive-500/10 rounded-xl border border-olive-500/20">
              <UserPlus className="w-5 h-5 text-olive-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-50">Create New User</h1>
          </div>
          <p className="text-neutral-400">Add a new user to the platform</p>
        </div>

        <div className="glass-effect border border-neutral-800/50 rounded-2xl p-8 card-shadow">
          {error && (
            <div className="mb-6 p-4 bg-error-500/10 border border-error-500/30 rounded-xl text-error-400 flex items-start gap-2">
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-neutral-300 mb-2.5"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200"
                  placeholder="John"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-neutral-300 mb-2.5"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-olive-500"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password <span className="text-red-400">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-olive-500"
                placeholder="••••••••"
              />
              <p className="mt-2 text-xs text-neutral-500">Minimum 6 characters</p>
            </div>

            <div className="flex items-center">
              <input
                id="isAdmin"
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="w-4 h-4 text-olive-600 bg-neutral-900/50 border-neutral-800 rounded focus:ring-olive-500 focus:ring-2"
              />
              <label htmlFor="isAdmin" className="ml-2 text-sm text-neutral-300">
                Grant admin privileges
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? 'Creating...' : 'Create User'}
              </button>
              <Link
                to="/admin/users"
                className="px-6 py-3.5 glass-effect border border-neutral-800/50 hover:border-neutral-700/50 text-neutral-50 font-semibold rounded-xl transition-all duration-200"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

