import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import ThreadCard from '../../components/ThreadCard'
import {
  getCommunityById,
  getCommunityThreads,
  isUserInCommunity,
  enrollUserInCommunity,
  createThread,
  deleteThread,
} from '../../db/queries'
import { MessageSquare, Plus, UserPlus, ChevronLeft, Trash2 } from 'lucide-react'
import { requireAdmin } from '../../lib/auth'
import { createMiddleware } from '@tanstack/react-start'
import { useState } from 'react'

const getCommunity = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { communityId: number }) => data)
  .handler(async ({ data }) => {
    return await getCommunityById(data.communityId)
  })

const getThreads = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { communityId: number }) => data)
  .handler(async ({ data }) => {
    return await getCommunityThreads(data.communityId)
  })

const checkMembership = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; communityId: number }) => data)
  .handler(async ({ data }) => {
    return await isUserInCommunity(data.userId, data.communityId)
  })

const enrollInCommunity = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; communityId: number }) => data)
  .handler(async ({ data }) => {
    await enrollUserInCommunity(data.userId, data.communityId)
    return { success: true }
  })

const createNewThread = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { communityId: number; authorId: number; title: string; content: string }) => data)
  .handler(async ({ data }) => {
    return await createThread(data)
  })

const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  requireAdmin(request)
  return next()
})

const deleteThreadFn = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .inputValidator((data: { threadId: number }) => data)
  .handler(async ({ data }) => {
    await deleteThread(data.threadId)
    return { success: true }
  })

export const Route = createFileRoute('/communities/$communityId')({
  component: CommunityDetail,
})

function CommunityDetail() {
  const { communityId } = Route.useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const location = useLocation()
  const communityIdNum = parseInt(communityId)

  console.log('CommunityDetail rendering, communityId:', communityId, 'pathname:', location.pathname)

  const [showCreateThread, setShowCreateThread] = useState(false)
  const [threadTitle, setThreadTitle] = useState('')
  const [threadContent, setThreadContent] = useState('')

  // Check if we're on a child route (threads)
  const isChildRoute = location.pathname.includes('/threads/')

  // All hooks must be called before any returns
  const { data: community, isLoading: communityLoading, error: communityError } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      const result = await getCommunity({ data: { communityId: communityIdNum } })
      console.log('Community data:', result)
      return result
    },
  })

  const { data: threads, isLoading: threadsLoading, error: threadsError } = useQuery({
    queryKey: ['communityThreads', communityId],
    queryFn: async () => {
      const result = await getThreads({ data: { communityId: communityIdNum } })
      console.log('Threads data:', result)
      return result
    },
  })

  const { data: isMember } = useQuery({
    queryKey: ['isMember', communityId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false
      return await checkMembership({
        data: { userId: user.id, communityId: communityIdNum },
      })
    },
    enabled: !!user?.id,
  })

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      return await enrollInCommunity({
        data: { userId: user.id, communityId: communityIdNum },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isMember'] })
      queryClient.invalidateQueries({ queryKey: ['userCommunities'] })
    },
  })

  const createThreadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      if (!threadTitle.trim() || !threadContent.trim()) throw new Error('Title and content required')
      return await createNewThread({
        data: {
          communityId: communityIdNum,
          authorId: user.id,
          title: threadTitle.trim(),
          content: threadContent.trim(),
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityThreads'] })
      setThreadTitle('')
      setThreadContent('')
      setShowCreateThread(false)
    },
  })

  const deleteThreadMutation = useMutation({
    mutationFn: async (threadId: number) => {
      return await deleteThreadFn({ data: { threadId } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityThreads'] })
      queryClient.invalidateQueries({ queryKey: ['userCommunities'] })
    },
  })

  // Validate communityId after all hooks are called
  if (isNaN(communityIdNum)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-red-400">Invalid community ID: {communityId}</div>
      </div>
    )
  }

  // If we're on a child route (threads), just render the outlet
  if (isChildRoute) {
    return <Outlet />
  }

  if (communityLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading community...</div>
      </div>
    )
  }

  if (communityError) {
    console.error('Community error:', communityError)
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-red-400">
          Error loading community: {communityError instanceof Error ? communityError.message : 'Unknown error'}
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Community not found (ID: {communityId})</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Please sign in to view this community</p>
        </div>
      </div>
    )
  }

  const handleEnroll = async () => {
    if (!user) return
    await enrollMutation.mutateAsync()
  }

  const handleCreateThread = async () => {
    await createThreadMutation.mutateAsync()
  }

  const canCreateThread = isMember === true

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          to="/communities"
          className="text-olive-400 hover:text-olive-300 mb-6 inline-flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Communities
        </Link>

        {/* Community Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{community.name}</h1>
          {community.description && (
            <p className="text-gray-300 text-lg mb-6">{community.description}</p>
          )}

          {/* Enroll button for general communities */}
          {community.type === 'general' && isMember === false && (
            <button
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="px-6 py-3 bg-olive-500 hover:bg-olive-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              {enrollMutation.isPending ? 'Enrolling...' : 'Join Community'}
            </button>
          )}

          {!canCreateThread && (
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mt-4">
              <p className="text-yellow-400 text-sm">
                You must join this community to create threads
              </p>
            </div>
          )}
        </div>

        {/* Create Thread Section */}
        {canCreateThread && (
          <div className="mb-6">
            {!showCreateThread ? (
              <button
                onClick={() => setShowCreateThread(true)}
                className="px-6 py-3 bg-olive-500 hover:bg-olive-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New Thread
              </button>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4">Create New Thread</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Title</label>
                    <input
                      type="text"
                      value={threadTitle}
                      onChange={(e) => setThreadTitle(e.target.value)}
                      placeholder="Thread title"
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-olive-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Content</label>
                    <textarea
                      value={threadContent}
                      onChange={(e) => setThreadContent(e.target.value)}
                      placeholder="Thread content"
                      rows={6}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-olive-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateThread}
                      disabled={createThreadMutation.isPending || !threadTitle.trim() || !threadContent.trim()}
                      className="px-4 py-2 bg-olive-500 hover:bg-olive-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createThreadMutation.isPending ? 'Creating...' : 'Create Thread'}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateThread(false)
                        setThreadTitle('')
                        setThreadContent('')
                      }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Threads Section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-6 h-6 text-olive-400" />
            <h2 className="text-2xl font-semibold text-white">Discussion Threads</h2>
            <span className="text-gray-400">({threads?.length || 0})</span>
          </div>

          {threadsError && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm">
                Error loading threads: {threadsError instanceof Error ? threadsError.message : 'Unknown error'}
              </p>
            </div>
          )}
          {threadsLoading ? (
            <div className="text-gray-400">Loading threads...</div>
          ) : !threads || threads.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No threads yet</p>
              <p className="text-gray-500 text-sm">
                {canCreateThread ? 'Be the first to start a discussion!' : 'Join this community to create threads'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {threads.map((item: any) => (
                <div key={item.thread.id} className="relative">
                  <ThreadCard
                    threadId={item.thread.id}
                    communityId={communityIdNum}
                    title={item.thread.title}
                    author={item.author}
                    createdAt={item.thread.createdAt}
                    replyCount={item.replyCount}
                  />
                  {user?.isAdmin && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
                          deleteThreadMutation.mutate(item.thread.id)
                        }
                      }}
                      disabled={deleteThreadMutation.isPending}
                      className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete thread"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

