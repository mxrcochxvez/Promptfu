import { createFileRoute, Link, useRouter, useNavigate } from '@tanstack/react-router'
import { createServerFn, createMiddleware } from '@tanstack/react-start'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/AuthContext'
import { createClass } from '../../../db/queries'
import { requireAdmin } from '../../../lib/auth'
import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'

const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  // Verify admin access
  requireAdmin(request)
  return next()
})

const createClassFn = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .inputValidator(
    (data: {
      title: string
      description?: string | null
      thumbnailUrl?: string | null
    }) => data
  )
  .handler(async ({ data }) => {
    return await createClass(data)
  })

export const Route = createFileRoute('/admin/classes/create')({
  component: CreateClass,
})

function CreateClass() {
  const { user } = useAuth()
  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate({ to: '/dashboard' })
    return null
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      return await createClassFn({
        data: {
          title,
          description: description || null,
          thumbnailUrl: thumbnailUrl || null,
        } as any,
      })
    },
    onSuccess: (newClass) => {
      queryClient.invalidateQueries({ queryKey: ['adminClasses'] })
      router.navigate({
        to: '/admin/classes/$classId/edit',
        params: { classId: newClass.id.toString() },
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
          to="/admin/classes"
          className="text-cyan-400 hover:text-cyan-300 mb-4 inline-flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Classes
        </Link>

        <h1 className="text-3xl font-bold text-white mb-6">Create New Class</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              placeholder="Enter class title"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              placeholder="Enter class description"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Thumbnail URL</label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Class'}
            </button>
            <Link
              to="/admin/classes"
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
