import { createFileRoute, Link, useRouter, useNavigate } from '@tanstack/react-router'
import { createServerFn, createMiddleware } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../../../../../../contexts/AuthContext'
import { updateLesson, deleteLesson, getLessonById } from '../../../../../../../../db/queries'
import { requireAdmin } from '../../../../../../../../lib/auth'
import { useState, useEffect } from 'react'
import { ChevronLeft, Trash2 } from 'lucide-react'

const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  // Verify admin access
  requireAdmin(request)
  return next()
})

const updateLessonFn = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .inputValidator(
    (data: {
      lessonId: number
      title: string
      content: string
      orderIndex: number
    }) => data
  )
  .handler(async ({ data }) => {
    return await updateLesson(data.lessonId, {
      title: data.title,
      content: data.content,
      orderIndex: data.orderIndex,
    })
  })

const deleteLessonFn = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .inputValidator((data: { lessonId: number }) => data)
  .handler(async ({ data }) => {
    await deleteLesson(data.lessonId)
    return { success: true }
  })

const getLesson = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { lessonId: number }) => data)
  .handler(async ({ data }) => {
    return await getLessonById(data.lessonId)
  })

export const Route = createFileRoute(
  '/admin/classes/$classId/units/$unitId/lessons/$lessonId/edit'
)({
  component: EditLesson,
})

function EditLesson() {
  const { user } = useAuth()
  const { classId, unitId, lessonId } = Route.useParams()
  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate({ to: '/dashboard' })
    return null
  }
  const lessonIdNum = parseInt(lessonId)

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      return await getLesson({ data: { lessonId: lessonIdNum } as any })
    },
  })

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [orderIndex, setOrderIndex] = useState(0)

  // Sync form when data loads
  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title)
      setContent(lesson.content)
      setOrderIndex(lesson.orderIndex)
    }
  }, [lesson])

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await updateLessonFn({
        data: {
          lessonId: lessonIdNum,
          title,
          content,
          orderIndex,
        } as any,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] })
      queryClient.invalidateQueries({ queryKey: ['adminLessons'] })
      queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] })
      router.navigate({
        to: '/admin/classes/$classId/units/$unitId/edit',
        params: { classId, unitId },
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await deleteLessonFn({
        data: { lessonId: lessonIdNum } as any,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] })
      queryClient.invalidateQueries({ queryKey: ['adminLessons'] })
      router.navigate({
        to: '/admin/classes/$classId/units/$unitId/edit',
        params: { classId, unitId },
      })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      alert('Please enter both title and content')
      return
    }
    await updateMutation.mutateAsync()
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return
    }
    await deleteMutation.mutateAsync()
  }

  if (isLoading || !lesson) {
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
          to="/admin/classes/$classId/units/$unitId/edit"
          params={{ classId, unitId }}
          className="text-cyan-400 hover:text-cyan-300 mb-4 inline-flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Unit Edit
        </Link>

        <h1 className="text-3xl font-bold text-white mb-6">Edit Lesson</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              placeholder="Enter lesson title"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Content (Markdown/HTML) *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={15}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 font-mono text-sm"
              placeholder="Enter lesson content in Markdown or HTML format..."
            />
            <p className="text-gray-400 text-sm mt-2">
              You can use Markdown formatting or HTML. The content will be rendered on the lesson page.
            </p>
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
              The order in which this lesson appears within the unit. Lower numbers appear first.
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
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
            <Link
              to="/admin/classes/$classId/units/$unitId/edit"
              params={{ classId, unitId }}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

