import { createFileRoute, Link, useRouter, useNavigate } from '@tanstack/react-router'
import { createServerFn, createMiddleware } from '@tanstack/react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../../contexts/AuthContext'
import { useEffect } from 'react'
import {
  getClassById,
  getUnitsByClassId,
  getTestsByClassId,
  updateClass,
  createUnit,
  createTest,
} from '../../../../db/queries'
import { requireAdmin } from '../../../../lib/auth'
import { useState } from 'react'
import { ChevronLeft, Plus, BookOpen, CheckCircle2 } from 'lucide-react'

const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  // Verify admin access
  requireAdmin(request)
  return next()
})

const getClass = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { classId: number }) => data)
  .handler(async ({ data }) => {
    return await getClassById(data.classId)
  })

const getUnits = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { classId: number }) => data)
  .handler(async ({ data }) => {
    return await getUnitsByClassId(data.classId)
  })

const getTests = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { classId: number }) => data)
  .handler(async ({ data }) => {
    return await getTestsByClassId(data.classId)
  })

const updateClassFn = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .inputValidator(
    (data: {
      classId: number
      title: string
      description?: string | null
      thumbnailUrl?: string | null
    }) => data
  )
  .handler(async ({ data }) => {
    return await updateClass(data.classId, {
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
    })
  })

const createUnitFn = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .inputValidator(
    (data: {
      classId: number
      title: string
      orderIndex: number
      content: string
    }) => data
  )
  .handler(async ({ data }) => {
    return await createUnit(data)
  })

const createTestFn = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .inputValidator(
    (data: {
      classId: number
      unitId?: number | null
      title: string
      description?: string | null
      passingScore?: string
    }) => data
  )
  .handler(async ({ data }) => {
    return await createTest(data)
  })

export const Route = createFileRoute('/admin/classes/$classId/edit')({
  component: EditClass,
})

function EditClass() {
  const { user } = useAuth()
  const { classId } = Route.useParams()
  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate({ to: '/dashboard' })
    return null
  }
  const classIdNum = parseInt(classId)

  const { data: classData } = useQuery({
    queryKey: ['adminClass', classId],
    queryFn: async () => {
      return await getClass({ data: { classId: classIdNum } as any })
    },
  })

  const { data: units } = useQuery({
    queryKey: ['adminUnits', classId],
    queryFn: async () => {
      return await getUnits({ data: { classId: classIdNum } as any })
    },
  })

  const { data: tests } = useQuery({
    queryKey: ['adminTests', classId],
    queryFn: async () => {
      return await getTests({ data: { classId: classIdNum } as any })
    },
  })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  // Sync form when data loads
  useEffect(() => {
    if (classData) {
      setTitle(classData.title)
      setDescription(classData.description || '')
      setThumbnailUrl(classData.thumbnailUrl || '')
    }
  }, [classData])

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await updateClassFn({
        data: {
          classId: classIdNum,
          title,
          description: description || null,
          thumbnailUrl: thumbnailUrl || null,
        } as any,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminClass'] })
      alert('Class updated successfully!')
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

  if (!classData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/admin/classes"
          className="text-olive-400 hover:text-olive-300 mb-4 inline-flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Classes
        </Link>

        <h1 className="text-3xl font-bold text-white mb-6">Edit Class</h1>

        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
          <div>
            <label className="block text-white font-medium mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-olive-500"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-olive-500"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Thumbnail URL</label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-olive-500"
            />
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-3 bg-olive-500 hover:bg-olive-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Units Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-olive-400" />
              Units ({units?.length || 0})
            </h2>
            <Link
              to="/admin/classes/$classId/units/create"
              params={{ classId }}
              className="px-4 py-2 bg-olive-500 hover:bg-olive-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Unit
            </Link>
          </div>

          {units && units.length > 0 ? (
            <div className="space-y-2">
              {units.map((unit, index) => (
                <div
                  key={unit.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-400 text-sm">Unit {index + 1}</span>
                      <h3 className="text-white font-medium">{unit.title}</h3>
                    </div>
                    <Link
                      to="/admin/classes/$classId/units/$unitId/edit"
                      params={{ classId, unitId: unit.id.toString() }}
                      className="text-olive-400 hover:text-olive-300"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No units yet. Add your first unit!</p>
          )}
        </div>

        {/* Tests Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-olive-400" />
              Tests ({tests?.length || 0})
            </h2>
            <Link
              to="/admin/classes/$classId/tests/create"
              params={{ classId }}
              className="px-4 py-2 bg-olive-500 hover:bg-olive-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Test
            </Link>
          </div>

          {tests && tests.length > 0 ? (
            <div className="space-y-2">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-medium">{test.title}</h3>
                      {test.description && (
                        <p className="text-gray-400 text-sm">{test.description}</p>
                      )}
                    </div>
                    <Link
                      to="/admin/classes/$classId/tests/$testId/edit"
                      params={{ classId, testId: test.id.toString() }}
                      className="text-olive-400 hover:text-olive-300"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No tests yet. Add your first test!</p>
          )}
        </div>
      </div>
    </div>
  )
}
