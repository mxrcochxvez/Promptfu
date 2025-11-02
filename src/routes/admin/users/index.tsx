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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
            <p className="text-gray-400">Manage all platform users</p>
          </div>
          <Link
            to="/admin/users/create"
            className="px-6 py-3 bg-olive-500 hover:bg-olive-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New User
          </Link>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-olive-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-gray-400">Loading users...</div>
        ) : !users || users.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-4">No users found</p>
            <Link
              to="/admin/users/create"
              className="inline-block px-6 py-3 bg-olive-500 hover:bg-olive-600 text-white font-semibold rounded-lg transition-colors"
            >
              Create Your First User
            </Link>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-olive-500 rounded-full text-white font-semibold mr-3">
                          {(u.firstName?.[0] || '') + (u.lastName?.[0] || '') || u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {u.firstName || u.lastName
                              ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
                              : 'No name'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-gray-300">
                        <Mail className="w-4 h-4 mr-2" />
                        {u.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.isAdmin ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/50">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/50">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to="/admin/users/$userId/edit"
                        params={{ userId: u.id.toString() }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-olive-500 hover:bg-olive-600 text-white rounded-lg transition-colors"
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

