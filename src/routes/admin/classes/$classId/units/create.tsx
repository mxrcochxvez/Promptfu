import { createFileRoute, Link, useRouter, useNavigate } from '@tanstack/react-router'
import { createServerFn, createMiddleware } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../../../contexts/AuthContext'
import { createUnit, getUnitsByClassId } from '../../../../../db/queries'
import { requireAdmin } from '../../../../../lib/auth'
import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'

const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  // Verify admin access
  requireAdmin(request)
  return next()
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

const getUnits = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { classId: number }) => data)
  .handler(async ({ data }) => {
    return await getUnitsByClassId(data.classId)
  })

export const Route = createFileRoute('/admin/classes/$classId/units/create')({
  component: CreateUnit,
})

function CreateUnit() {
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

  const { data: existingUnits } = useQuery({
    queryKey: ['units', classId],
    queryFn: async () => {
      return await getUnits({ data: { classId: classIdNum } as any })
    },
  })

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const orderIndex = (existingUnits?.length || 0) + 1

  const createMutation = useMutation({
    mutationFn: async () => {
      return await createUnitFn({
        data: {
          classId: classIdNum,
          title,
          orderIndex,
          content,
        } as any,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      queryClient.invalidateQueries({ queryKey: ['adminUnits'] })
      router.navigate({
        to: '/admin/classes/$classId/edit',
        params: { classId },
      })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      alert('Please enter both title and content')
      return
    }
    await createMutation.mutateAsync()
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

        <h1 className="text-3xl font-bold text-white mb-6">Create New Unit</h1>

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
              Content (Markdown/HTML) *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={15}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 font-mono text-sm"
              placeholder="Enter unit content in Markdown or HTML format..."
            />
            <p className="text-gray-400 text-sm mt-2">
              You can use Markdown formatting or HTML. The content will be rendered on the unit page.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Unit'}
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
      </div>
    </div>
  )
}
