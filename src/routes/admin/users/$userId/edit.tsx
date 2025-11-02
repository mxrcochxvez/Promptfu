import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useAuth } from '../../../../contexts/AuthContext'
import { getUserById, updateUser, deleteUser, updateUserRole } from '../../../../db/auth-queries'
import { Edit, ArrowLeft, Trash2, Shield, Save } from 'lucide-react'

const getUserServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: number) => data)
  .handler(async ({ data }) => {
    return await getUserById(data)
  })

const updateUserServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (data: {
      userId: number
      email?: string
      firstName?: string
      lastName?: string
      password?: string
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      const { userId, ...updateData } = data
      const user = await updateUser(userId, updateData)
      return { success: true, user }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user',
      }
    }
  })

const deleteUserServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: number) => data)
  .handler(async ({ data }) => {
    try {
      await deleteUser(data)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete user',
      }
    }
  })

const updateUserRoleServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; isAdmin: boolean }) => data)
  .handler(async ({ data }) => {
    try {
      const user = await updateUserRole(data.userId, data.isAdmin)
      return { success: true, user }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update role',
      }
    }
  })

export const Route = createFileRoute('/admin/users/$userId/edit')({
  component: EditUserPage,
})

function EditUserPage() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const { userId } = Route.useParams()
  const userIdNum = parseInt(userId, 10)

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Redirect if not admin
  if (currentUser && !currentUser.isAdmin) {
    navigate({ to: '/dashboard' })
    return null
  }

  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ['user', userIdNum],
    queryFn: async () => {
      return await getUserServerFn({ data: userIdNum })
    },
  })

  useEffect(() => {
    if (userData) {
      setEmail(userData.email)
      setFirstName(userData.firstName || '')
      setLastName(userData.lastName || '')
      setIsAdmin(userData.isAdmin)
    }
  }, [userData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await updateUserServerFn({
        data: {
          userId: userIdNum,
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          ...(password && { password }),
        },
      })

      if (result.success) {
        navigate({ to: '/admin/users' })
      } else {
        setError(result.message || 'Failed to update user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRoleToggle() {
    const newAdminStatus = !isAdmin
    setIsLoading(true)
    setError('')

    try {
      const result = await updateUserRoleServerFn({
        data: { userId: userIdNum, isAdmin: newAdminStatus },
      })

      if (result.success && result.user) {
        setIsAdmin(result.user.isAdmin)
      } else {
        setError(result.message || 'Failed to update role')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    setIsLoading(true)
    setError('')

    try {
      const result = await deleteUserServerFn({ data: userIdNum })

      if (result.success) {
        navigate({ to: '/admin/users' })
      } else {
        setError(result.message || 'Failed to delete user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setIsLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white">Loading user...</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">User not found</p>
          <Link
            to="/admin/users"
            className="text-cyan-400 hover:text-cyan-300"
          >
            Back to Users
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-cyan-500/10 p-2 rounded-lg">
              <Edit className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-4xl font-bold text-white">Edit User</h1>
          </div>
          <p className="text-gray-400">Update user information and permissions</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Role Toggle */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="font-medium text-white">Admin Status</span>
                </div>
                <p className="text-sm text-gray-400">
                  Grant or revoke administrator privileges
                </p>
              </div>
              <button
                onClick={handleRoleToggle}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isAdmin
                    ? 'bg-purple-500 hover:bg-purple-600 text-white'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                } disabled:opacity-50`}
              >
                {isAdmin ? 'Admin' : 'User'}
              </button>
            </div>
          </div>

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
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
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
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
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
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                New Password (leave blank to keep current)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum 6 characters. Only update if you want to change the password.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                to="/admin/users"
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* Delete Section */}
          <div className="pt-6 border-t border-slate-700">
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-400 mb-4">
                Deleting a user will permanently remove their account and all associated data.
                This action cannot be undone.
              </p>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-400 text-sm font-medium">
                    Are you sure you want to delete this user?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

