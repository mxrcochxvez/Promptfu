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
    <div className="min-h-screen bg-gradient-hero py-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-50">Admin - Classes</h1>
          <Link
            to="/admin/classes/create"
            className="px-6 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Class
          </Link>
        </div>

        {isLoading ? (
          <div className="text-neutral-400">Loading classes...</div>
        ) : !classes || classes.length === 0 ? (
          <div className="glass-effect border border-neutral-800/50 rounded-2xl p-12 md:p-16 text-center card-shadow">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-olive-500/10 rounded-full mb-6 border border-olive-500/20">
              <BookOpen className="w-10 h-10 text-olive-400/60" />
            </div>
            <p className="text-neutral-50 text-xl mb-4 font-semibold">No classes created yet</p>
            <Link
              to="/admin/classes/create"
              className="inline-block px-6 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              Create Your First Class
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className="group glass-effect border border-neutral-800/50 rounded-2xl overflow-hidden hover:border-olive-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-olive-500/10 hover:-translate-y-1 card-shadow"
              >
                {classItem.thumbnailUrl && (
                  <div className="w-full h-48 overflow-hidden bg-neutral-900">
                    <img
                      src={classItem.thumbnailUrl}
                      alt={classItem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-neutral-50 mb-2 group-hover:text-olive-400 transition-colors">
                    {classItem.title}
                  </h3>
                  {classItem.description && (
                    <p className="text-neutral-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {classItem.description}
                    </p>
                  )}
                  <Link
                    to="/admin/classes/$classId/edit"
                    params={{ classId: classItem.id.toString() }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-medium rounded-xl transition-all duration-200 shadow-md shadow-olive-500/20 hover:shadow-lg hover:shadow-olive-500/30"
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
