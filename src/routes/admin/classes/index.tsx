import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { createServerFn, createMiddleware } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/AuthContext'
import { getAllClasses } from '../../../db/queries'
import { requireAdmin } from '../../../lib/auth'
import { Plus, Edit, BookOpen } from 'lucide-react'

const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  // Verify admin access
  requireAdmin(request)
  return next()
})

const getClasses = createServerFn({
  method: 'GET',
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return await getAllClasses()
  })

export const Route = createFileRoute('/admin/classes/')({
  component: AdminClassesList,
})

function AdminClassesList() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate({ to: '/dashboard' })
    return null
  }

  const { data: classes, isLoading } = useQuery({
    queryKey: ['adminClasses'],
    queryFn: async () => {
      return await getClasses()
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Admin - Classes</h1>
          <Link
            to="/admin/classes/create"
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Class
          </Link>
        </div>

        {isLoading ? (
          <div className="text-gray-400">Loading classes...</div>
        ) : !classes || classes.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-4">No classes created yet</p>
            <Link
              to="/admin/classes/create"
              className="inline-block px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
            >
              Create Your First Class
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-cyan-500/50 transition-colors"
              >
                {classItem.thumbnailUrl && (
                  <div className="w-full h-48 overflow-hidden">
                    <img
                      src={classItem.thumbnailUrl}
                      alt={classItem.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {classItem.title}
                  </h3>
                  {classItem.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {classItem.description}
                    </p>
                  )}
                  <Link
                    to="/admin/classes/$classId/edit"
                    params={{ classId: classItem.id.toString() }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
