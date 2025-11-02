import { createFileRoute, Link, useRouter, useNavigate } from '@tanstack/react-router'
import { createServerFn, createMiddleware } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../../../../contexts/AuthContext'
import { updateUnit, getUnitById, getLessonsByUnitId } from '../../../../../../db/queries'
import { requireAdmin } from '../../../../../../lib/auth'
import { useState, useEffect } from 'react'
import { ChevronLeft, Plus, BookOpen } from 'lucide-react'

const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  // Verify admin access
  requireAdmin(request)
  return next()
})

const updateUnitFn = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .inputValidator(
    (data: {
      unitId: number
      title: string
      orderIndex: number
    }) => data
  )
  .handler(async ({ data }) => {
    return await updateUnit(data.unitId, {
      title: data.title,
      orderIndex: data.orderIndex,
    })
  })

const getUnit = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { unitId: number }) => data)
  .handler(async ({ data }) => {
    return await getUnitById(data.unitId)
  })

const getLessons = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { unitId: number }) => data)
  .handler(async ({ data }) => {
    return await getLessonsByUnitId(data.unitId)
  })

export const Route = createFileRoute(
  '/admin/classes/$classId/units/$unitId/edit'
)({
  component: EditUnit,
})

function EditUnit() {
  const { user } = useAuth()
  const { classId, unitId } = Route.useParams()
  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate({ to: '/dashboard' })
    return null
  }
  const unitIdNum = parseInt(unitId)

  const { data: unit, isLoading } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: async () => {
      return await getUnit({ data: { unitId: unitIdNum } as any })
    },
  })

  const { data: lessons } = useQuery({
    queryKey: ['adminLessons', unitId],
    queryFn: async () => {
      return await getLessons({ data: { unitId: unitIdNum } as any })
    },
  })

  const [title, setTitle] = useState('')
  const [orderIndex, setOrderIndex] = useState(0)

  // Sync form when data loads
  useEffect(() => {
    if (unit) {
      setTitle(unit.title)
      setOrderIndex(unit.orderIndex)
    }
  }, [unit])

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await updateUnitFn({
        data: {
          unitId: unitIdNum,
          title,
          orderIndex,
        } as any,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      queryClient.invalidateQueries({ queryKey: ['adminUnits'] })
      queryClient.invalidateQueries({ queryKey: ['unit', unitId] })
      alert('Unit updated successfully!')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }
    await updateMutation.mutateAsync()
  }

  if (isLoading || !unit) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/admin/classes/$classId/edit"
          params={{ classId }}
          className="text-cyan-400 hover:text-cyan-300 mb-4 inline-flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Class Edit
        </Link>

        <h1 className="text-3xl font-bold text-white mb-6">Edit Unit</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              placeholder="Enter unit title"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Order Index *
            </label>
            <input
              type="number"
              min="0"
              value={orderIndex}
              onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              placeholder="0"
            />
            <p className="text-gray-400 text-sm mt-2">
              The order in which this unit appears in the class. Lower numbers
              appear first.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              to="/admin/classes/$classId/edit"
              params={{ classId }}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Lessons Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              Lessons ({lessons?.length || 0})
            </h2>
            <Link
              to="/admin/classes/$classId/units/$unitId/lessons/create"
              params={{ classId, unitId }}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Lesson
            </Link>
          </div>

          {lessons && lessons.length > 0 ? (
            <div className="space-y-2">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-400 text-sm">Lesson {index + 1}</span>
                      <h3 className="text-white font-medium">{lesson.title}</h3>
                    </div>
                    <Link
                      to="/admin/classes/$classId/units/$unitId/lessons/$lessonId/edit"
                      params={{ classId, unitId, lessonId: lesson.id.toString() }}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">
              No lessons yet. Add your first lesson to start building course content!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

