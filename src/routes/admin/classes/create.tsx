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
    <div className="min-h-screen bg-gradient-hero py-8 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/admin/classes"
          className="text-accent-500 hover:text-accent-400 mb-4 inline-flex items-center gap-2 transition-colors duration-200 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Classes
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-neutral-50 mb-6">Create New Class</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-effect border border-neutral-800/50 rounded-2xl p-6 card-shadow space-y-6">
            <div>
              <label className="block text-neutral-300 font-medium mb-2.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200"
                placeholder="Enter class title"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-2.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200 resize-none"
                placeholder="Enter class description"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-2.5">Thumbnail URL</label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-6 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Class'}
              </button>
              <Link
                to="/admin/classes"
                className="px-6 py-3.5 glass-effect border border-neutral-800/50 hover:border-neutral-700/50 text-neutral-50 font-semibold rounded-xl transition-all duration-200"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
