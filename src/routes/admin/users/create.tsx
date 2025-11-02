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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 text-olive-400 hover:text-olive-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-olive-500/10 p-2 rounded-lg">
              <UserPlus className="w-6 h-6 text-olive-400" />
            </div>
            <h1 className="text-4xl font-bold text-white">Create New User</h1>
          </div>
          <p className="text-gray-400">Add a new user to the platform</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-olive-500"
                  placeholder="John"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-olive-500"
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
              <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            <div className="flex items-center">
              <input
                id="isAdmin"
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="w-4 h-4 text-olive-600 bg-slate-700 border-slate-600 rounded focus:ring-olive-500 focus:ring-2"
              />
              <label htmlFor="isAdmin" className="ml-2 text-sm text-gray-300">
                Grant admin privileges
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-olive-500 hover:bg-olive-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create User'}
              </button>
              <Link
                to="/admin/users"
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
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

