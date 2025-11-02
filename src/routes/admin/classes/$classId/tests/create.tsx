import { createFileRoute, Link, useRouter, useNavigate } from '@tanstack/react-router'
import { createServerFn, createMiddleware } from '@tanstack/react-start'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../../../contexts/AuthContext'
import { createTest } from '../../../../../db/queries'
import { requireAdmin } from '../../../../../lib/auth'
import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'

const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  // Verify admin access
  requireAdmin(request)
  return next()
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

export const Route = createFileRoute('/admin/classes/$classId/tests/create')({
  component: CreateTest,
})

function CreateTest() {
  const { user } = useAuth()
  const { classId } = Route.useParams()
  const router = useRouter()
  const navigate = useNavigate()

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate({ to: '/dashboard' })
    return null
  }
  const queryClient = useQueryClient()
  const classIdNum = parseInt(classId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [passingScore, setPassingScore] = useState('70')

  const createMutation = useMutation({
    mutationFn: async () => {
      return await createTestFn({
        data: {
          classId: classIdNum,
          unitId: null,
          title,
          description: description || null,
          passingScore: passingScore || '70',
        } as any,
      })
    },
    onSuccess: (newTest) => {
      queryClient.invalidateQueries({ queryKey: ['adminTests'] })
      router.navigate({
        to: '/admin/classes/$classId/tests/$testId/edit',
        params: { classId, testId: newTest.id.toString() },
      })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }
    await createMutation.mutateAsync()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/admin/classes/$classId/edit"
          params={{ classId }}
          className="text-olive-400 hover:text-olive-300 mb-4 inline-flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Class Edit
        </Link>

        <h1 className="text-3xl font-bold text-white mb-6">Create New Test</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-olive-500"
              placeholder="Enter test title"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-olive-500"
              placeholder="Enter test description"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Passing Score (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-olive-500"
              placeholder="70"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-3 bg-olive-500 hover:bg-olive-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Test'}
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

        <div className="mt-8 p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <p className="text-gray-400 text-sm">
            After creating the test, you'll be able to add questions to it.
          </p>
        </div>
      </div>
    </div>
  )
}
