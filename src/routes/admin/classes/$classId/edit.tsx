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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-olive-500/30 border-t-olive-500 mx-auto mb-4"></div>
          <div className="text-neutral-300">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-8 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/admin/classes"
          className="text-accent-500 hover:text-accent-400 mb-4 inline-flex items-center gap-2 transition-colors duration-200 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Classes
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-neutral-50 mb-6">Edit Class</h1>

        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
          <div className="glass-effect border border-neutral-800/50 rounded-2xl p-6 card-shadow space-y-6">
            <div>
              <label className="block text-neutral-300 font-medium mb-2.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-2.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200 resize-none"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-2.5">Thumbnail URL</label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Public Preview Link */}
        {classData && (
          <div className="mb-8 glass-effect border border-neutral-800/50 rounded-2xl p-6 card-shadow">
            <h3 className="text-lg font-bold text-neutral-50 mb-2">Public Preview Link</h3>
            <p className="text-neutral-400 text-sm mb-3">Share this link to preview the course publicly:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-neutral-900/50 border border-neutral-800 rounded-xl text-sm text-olive-400 break-all font-mono">
                {typeof window !== 'undefined' 
                  ? `${window.location.origin}/classes/${classData.slug}`
                  : `/classes/${classData.slug}`
                }
              </code>
              <button
                onClick={() => {
                  const url = typeof window !== 'undefined' 
                    ? `${window.location.origin}/classes/${classData.slug}`
                    : `/classes/${classData.slug}`
                  navigator.clipboard.writeText(url)
                  alert('Link copied to clipboard!')
                }}
                className="px-4 py-2 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-medium rounded-xl transition-all duration-200 text-sm shadow-md shadow-olive-500/20 hover:shadow-lg hover:shadow-olive-500/30"
              >
                Copy
              </button>
            </div>
            <p className="text-neutral-500 text-xs mt-2">Slug: <code className="text-olive-400 font-mono">{classData.slug}</code></p>
          </div>
        )}

        {/* Units Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-50 flex items-center gap-3">
              <div className="p-2 bg-olive-500/10 rounded-xl border border-olive-500/20">
                <BookOpen className="w-5 h-5 text-olive-400" />
              </div>
              Units ({units?.length || 0})
            </h2>
            <Link
              to="/admin/classes/$classId/units/create"
              params={{ classId }}
              className="px-4 py-2.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-medium rounded-xl transition-all duration-200 shadow-md shadow-olive-500/20 hover:shadow-lg hover:shadow-olive-500/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Unit
            </Link>
          </div>

          {units && units.length > 0 ? (
            <div className="space-y-3">
              {units.map((unit, index) => (
                <div
                  key={unit.id}
                  className="glass-effect border border-neutral-800/50 rounded-xl p-4 hover:border-olive-500/40 transition-all duration-200 card-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-neutral-500 text-sm font-medium">Unit {index + 1}</span>
                      <h3 className="text-neutral-50 font-bold">{unit.title}</h3>
                    </div>
                    <Link
                      to="/admin/classes/$classId/units/$unitId/edit"
                      params={{ classId, unitId: unit.id.toString() }}
                      className="text-accent-500 hover:text-accent-400 transition-colors duration-200 font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-400">No units yet. Add your first unit!</p>
          )}
        </div>

        {/* Tests Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-50 flex items-center gap-3">
              <div className="p-2 bg-accent-500/10 rounded-xl border border-accent-500/20">
                <CheckCircle2 className="w-5 h-5 text-accent-400" />
              </div>
              Tests ({tests?.length || 0})
            </h2>
            <Link
              to="/admin/classes/$classId/tests/create"
              params={{ classId }}
              className="px-4 py-2.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-medium rounded-xl transition-all duration-200 shadow-md shadow-olive-500/20 hover:shadow-lg hover:shadow-olive-500/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Test
            </Link>
          </div>

          {tests && tests.length > 0 ? (
            <div className="space-y-3">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="glass-effect border border-neutral-800/50 rounded-xl p-4 hover:border-olive-500/40 transition-all duration-200 card-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-neutral-50 font-bold">{test.title}</h3>
                      {test.description && (
                        <p className="text-neutral-400 text-sm mt-1">{test.description}</p>
                      )}
                    </div>
                    <Link
                      to="/admin/classes/$classId/tests/$testId/edit"
                      params={{ classId, testId: test.id.toString() }}
                      className="text-accent-500 hover:text-accent-400 transition-colors duration-200 font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-400">No tests yet. Add your first test!</p>
          )}
        </div>
      </div>
    </div>
  )
}
