import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { getAllUsers } from '../../../db/auth-queries'
import { useAuth } from '../../../contexts/AuthContext'
import { useNavigate } from '@tanstack/react-router'
import { Users, Plus, Search, Edit, Shield, Mail, Calendar } from 'lucide-react'
import { useState } from 'react'

const getUsersServerFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await getAllUsers()
})

export const Route = createFileRoute('/admin/users/')({
  component: AdminUsersList,
})

function AdminUsersList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate({ to: '/dashboard' })
    return null
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      return await getUsersServerFn()
    },
  })

  const filteredUsers = users
    ? users.filter(
        (u) =>
          !searchQuery ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.firstName && u.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (u.lastName && u.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : []

  return (
    <div className="min-h-screen bg-gradient-hero py-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-50 mb-2">User Management</h1>
            <p className="text-neutral-400">Manage all platform users</p>
          </div>
          <Link
            to="/admin/users/create"
            className="px-6 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New User
          </Link>
        </div>

        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 glass-effect border border-neutral-800/50 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-neutral-400">Loading users...</div>
        ) : !users || users.length === 0 ? (
          <div className="glass-effect border border-neutral-800/50 rounded-2xl p-12 md:p-16 text-center card-shadow">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-500/10 rounded-full mb-6 border border-accent-500/20">
              <Users className="w-10 h-10 text-accent-400/60" />
            </div>
            <p className="text-neutral-50 text-xl mb-4 font-semibold">No users found</p>
            <Link
              to="/admin/users/create"
              className="inline-block px-6 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              Create Your First User
            </Link>
          </div>
        ) : (
          <div className="glass-effect border border-neutral-800/50 rounded-2xl overflow-hidden card-shadow">
            <table className="w-full">
              <thead className="bg-neutral-900/50 border-b border-neutral-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-900/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-olive-500 to-olive-600 rounded-full text-white font-semibold mr-3 shadow-lg shadow-olive-500/20">
                          {(u.firstName?.[0] || '') + (u.lastName?.[0] || '') || u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-neutral-50 font-medium">
                            {u.firstName || u.lastName
                              ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
                              : 'No name'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-neutral-300">
                        <Mail className="w-4 h-4 mr-2" />
                        {u.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.isAdmin ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent-500/20 text-accent-300 border border-accent-500/50">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-700/50 text-neutral-300 border border-neutral-700/50">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-400">
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to="/admin/users/$userId/edit"
                        params={{ userId: u.id.toString() }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white rounded-xl transition-all duration-200 shadow-md shadow-olive-500/20 hover:shadow-lg hover:shadow-olive-500/30"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

