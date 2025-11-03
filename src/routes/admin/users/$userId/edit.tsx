import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useAuth } from '../../../../contexts/AuthContext'
import { getUserById, updateUser, deleteUser, updateUserRole } from '../../../../db/auth-queries'
import { getUserEnrollments, getAllClasses, enrollUserInClass, unenrollUserFromClass, isUserEnrolled } from '../../../../db/queries'
import { Edit, ArrowLeft, Trash2, Shield, Save, BookOpen, X, Plus, Trash } from 'lucide-react'

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

const getUserEnrollmentsServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: number) => data)
  .handler(async ({ data }) => {
    return await getUserEnrollments(data)
  })

const getAllClassesServerFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await getAllClasses()
})

const enrollUserServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; classId: number }) => data)
  .handler(async ({ data }) => {
    try {
      // Check if already enrolled
      const alreadyEnrolled = await isUserEnrolled(data.userId, data.classId)
      if (alreadyEnrolled) {
        return { success: false, message: 'User is already enrolled in this class' }
      }
      await enrollUserInClass(data.userId, data.classId)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to enroll user',
      }
    }
  })

const unenrollUserServerFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; classId: number }) => data)
  .handler(async ({ data }) => {
    try {
      await unenrollUserFromClass(data.userId, data.classId)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to unenroll user',
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
  const queryClient = useQueryClient()

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [enrollmentError, setEnrollmentError] = useState('')

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

  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['userEnrollments', userIdNum],
    queryFn: async () => {
      return await getUserEnrollmentsServerFn({ data: userIdNum })
    },
    enabled: showEnrollmentModal,
  })

  const { data: allClasses, isLoading: loadingClasses } = useQuery({
    queryKey: ['allClasses'],
    queryFn: async () => {
      return await getAllClassesServerFn()
    },
    enabled: showEnrollmentModal,
  })

  const enrollMutation = useMutation({
    mutationFn: async (classId: number) => {
      return await enrollUserServerFn({ data: { userId: userIdNum, classId } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userEnrollments', userIdNum] })
      setSelectedClassId('')
      setEnrollmentError('')
    },
    onError: (error) => {
      setEnrollmentError(error instanceof Error ? error.message : 'Failed to enroll user')
    },
  })

  const unenrollMutation = useMutation({
    mutationFn: async (classId: number) => {
      return await unenrollUserServerFn({ data: { userId: userIdNum, classId } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userEnrollments', userIdNum] })
      setEnrollmentError('')
    },
    onError: (error) => {
      setEnrollmentError(error instanceof Error ? error.message : 'Failed to unenroll user')
    },
  })

  const handleEnroll = async () => {
    if (!selectedClassId) return
    const classIdNum = parseInt(selectedClassId, 10)
    if (isNaN(classIdNum)) return
    
    setEnrollmentError('')
    try {
      const result = await enrollMutation.mutateAsync(classIdNum)
      if (!result.success && result.message) {
        setEnrollmentError(result.message)
      }
    } catch (error) {
      // Error is already handled by onError callback
    }
  }

  const handleUnenroll = async (classId: number) => {
    setEnrollmentError('')
    try {
      const result = await unenrollMutation.mutateAsync(classId)
      if (!result.success && result.message) {
        setEnrollmentError(result.message)
      }
    } catch (error) {
      // Error is already handled by onError callback
    }
  }

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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-olive-500/30 border-t-olive-500 mx-auto mb-4"></div>
          <p className="text-neutral-300">Loading user...</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-50 text-xl mb-4">User not found</p>
          <Link
            to="/admin/users"
            className="text-accent-500 hover:text-accent-400 transition-colors duration-200 font-medium"
          >
            Back to Users
          </Link>
        </div>
      </div>
    )
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
              <Edit className="w-5 h-5 text-olive-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-50">Edit User</h1>
          </div>
          <p className="text-neutral-400">Update user information and permissions</p>
        </div>

        <div className="glass-effect border border-neutral-800/50 rounded-2xl p-8 space-y-6 card-shadow">
          {error && (
            <div className="p-4 bg-error-500/10 border border-error-500/30 rounded-xl text-error-400 flex items-start gap-2">
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Role Toggle */}
          <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="font-medium text-neutral-50">Admin Status</span>
                </div>
                <p className="text-sm text-neutral-400">
                  Grant or revoke administrator privileges
                </p>
              </div>
              <button
                onClick={handleRoleToggle}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isAdmin
                    ? 'bg-accent-500 hover:bg-accent-600 text-white'
                    : 'bg-neutral-600 hover:bg-neutral-500 text-white'
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
                  className="block text-sm font-medium text-neutral-300 mb-2"
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
                  className="block text-sm font-medium text-neutral-300 mb-2"
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
                className="block text-sm font-medium text-neutral-300 mb-2"
              >
                Email <span className="text-error-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-300 mb-2"
              >
                New Password (leave blank to keep current)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Minimum 6 characters. Only update if you want to change the password.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Save className="w-5 h-5" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                to="/admin/users"
                className="px-6 py-3.5 glass-effect border border-neutral-800/50 hover:border-neutral-700/50 text-neutral-50 font-semibold rounded-xl transition-all duration-200"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* Class Enrollments Section */}
          <div className="pt-6 border-t border-neutral-800/50">
            <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-5 h-5 text-olive-400" />
                    <span className="font-medium text-neutral-50">Class Enrollments</span>
                  </div>
                  <p className="text-sm text-neutral-400">
                    Manage user's class enrollments
                  </p>
                </div>
                <button
                  onClick={() => setShowEnrollmentModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-medium rounded-xl transition-all duration-200 shadow-md shadow-olive-500/20 hover:shadow-lg hover:shadow-olive-500/30 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Manage Enrollments
                </button>
              </div>
            </div>
          </div>

          {/* Delete Section */}
          <div className="pt-6 border-t border-neutral-800/50">
            <div className="bg-error-500/10 border border-error-500/30 rounded-xl p-4">
              <h3 className="text-error-400 font-semibold mb-2">Danger Zone</h3>
              <p className="text-sm text-neutral-400 mb-4">
                Deleting a user will permanently remove their account and all associated data.
                This action cannot be undone.
              </p>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2.5 bg-error-600 hover:bg-error-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-md shadow-error-500/20 hover:shadow-lg hover:shadow-error-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-error-400 text-sm font-medium">
                    Are you sure you want to delete this user?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="px-4 py-2.5 bg-error-600 hover:bg-error-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-6 py-3.5 glass-effect border border-neutral-800/50 hover:border-neutral-700/50 text-neutral-50 font-semibold rounded-xl transition-all duration-200"
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

      {/* Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-effect border border-neutral-800/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto card-shadow">
            <div className="sticky top-0 glass-effect border-b border-neutral-800/50 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-50 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-olive-400" />
                  Manage Class Enrollments
                </h2>
                <p className="text-sm text-neutral-400 mt-1">
                  Enroll or unenroll user from classes
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEnrollmentModal(false)
                  setEnrollmentError('')
                  setSelectedClassId('')
                }}
                className="p-2 hover:bg-neutral-800/50 rounded-lg transition-all duration-200 hover:scale-110 focus-ring"
              >
                <X className="w-5 h-5 text-neutral-300" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {enrollmentError && (
                <div className="p-4 bg-error-500/10 border border-error-500/30 rounded-xl text-error-400">
                  {enrollmentError}
                </div>
              )}

              {/* Add Enrollment */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2.5">
                  Enroll in New Class
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    disabled={loadingClasses || enrollMutation.isPending}
                    className="flex-1 px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200 disabled:opacity-50"
                  >
                    <option value="">Select a class...</option>
                    {allClasses &&
                      allClasses
                        .filter(
                          (c) =>
                            !enrollments?.some((e) => e.class.id === c.id)
                        )
                        .map((c) => (
                          <option key={c.id} value={c.id.toString()}>
                            {c.title}
                          </option>
                        ))}
                  </select>
                  <button
                    onClick={handleEnroll}
                    disabled={
                      !selectedClassId ||
                      loadingClasses ||
                      enrollMutation.isPending
                    }
                    className="px-4 py-3 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-olive-500/20 hover:shadow-lg hover:shadow-olive-500/30"
                  >
                    {enrollMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Enroll
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Current Enrollments */}
              <div>
                <h3 className="text-lg font-bold text-neutral-50 mb-4">
                  Current Enrollments
                </h3>
                {loadingEnrollments ? (
                  <div className="text-neutral-400 py-4 text-center">
                    Loading enrollments...
                  </div>
                ) : !enrollments || enrollments.length === 0 ? (
                  <div className="text-neutral-400 py-4 text-center">
                    No enrollments found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrollments.map((enrollment) => (
                      <div
                        key={enrollment.enrollment.id}
                        className="flex items-center justify-between p-4 bg-neutral-900/50 rounded-xl border border-neutral-800/50"
                      >
                        <div>
                          <div className="font-bold text-neutral-50">
                            {enrollment.class.title}
                          </div>
                          {enrollment.class.description && (
                            <div className="text-sm text-neutral-400 mt-1">
                              {enrollment.class.description}
                            </div>
                          )}
                          <div className="text-xs text-neutral-500 mt-1">
                            Enrolled:{' '}
                            {enrollment.enrollment.enrolledAt
                              ? new Date(
                                  enrollment.enrollment.enrolledAt
                                ).toLocaleDateString()
                              : 'N/A'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnenroll(enrollment.class.id)}
                          disabled={unenrollMutation.isPending}
                          className="px-4 py-2.5 bg-error-600 hover:bg-error-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {unenrollMutation.isPending ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            </>
                          ) : (
                            <>
                              <Trash className="w-4 h-4" />
                              Unenroll
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 glass-effect border-t border-neutral-800/50 px-6 py-4 flex justify-end">
              <button
                onClick={() => {
                  setShowEnrollmentModal(false)
                  setEnrollmentError('')
                  setSelectedClassId('')
                }}
                className="px-6 py-3.5 glass-effect border border-neutral-800/50 hover:border-neutral-700/50 text-neutral-50 font-semibold rounded-xl transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

