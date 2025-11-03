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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-error-400">Invalid community ID: {communityId}</div>
      </div>
    )
  }

  // If we're on a child route (threads), just render the outlet
  if (isChildRoute) {
    return <Outlet />
  }

  if (communityLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-olive-500/30 border-t-olive-500 mx-auto mb-4"></div>
          <div className="text-neutral-300">Loading community...</div>
        </div>
      </div>
    )
  }

  if (communityError) {
    console.error('Community error:', communityError)
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-error-400">
          Error loading community: {communityError instanceof Error ? communityError.message : 'Unknown error'}
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-neutral-50">Community not found (ID: {communityId})</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-50 text-xl mb-4">Please sign in to view this community</p>
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
    <div className="min-h-screen bg-gradient-hero py-8 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          to="/communities"
          className="text-accent-500 hover:text-accent-400 mb-6 inline-flex items-center gap-2 transition-colors duration-200 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Communities
        </Link>

        {/* Community Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-50 mb-3">{community.name}</h1>
          {community.description && (
            <p className="text-neutral-300 text-lg mb-6 leading-relaxed">{community.description}</p>
          )}

          {/* Enroll button for general communities */}
          {community.type === 'general' && isMember === false && (
            <button
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="px-6 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="w-5 h-5" />
              {enrollMutation.isPending ? 'Enrolling...' : 'Join Community'}
            </button>
          )}

          {!canCreateThread && (
            <div className="glass-effect border border-warning-500/30 rounded-xl p-4 mt-4 bg-warning-500/10 card-shadow">
              <p className="text-warning-400 text-sm font-medium">
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
                className="px-6 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" />
                Create New Thread
              </button>
            ) : (
              <div className="glass-effect border border-neutral-800/50 rounded-2xl p-6 card-shadow">
                <h3 className="text-neutral-50 font-bold mb-4">Create New Thread</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-neutral-300 text-sm font-medium mb-2.5">Title</label>
                    <input
                      type="text"
                      value={threadTitle}
                      onChange={(e) => setThreadTitle(e.target.value)}
                      placeholder="Thread title"
                      className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 text-sm font-medium mb-2.5">Content</label>
                    <textarea
                      value={threadContent}
                      onChange={(e) => setThreadContent(e.target.value)}
                      placeholder="Thread content"
                      rows={6}
                      className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200 resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateThread}
                      disabled={createThreadMutation.isPending || !threadTitle.trim() || !threadContent.trim()}
                      className="px-4 py-3 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-olive-500/20 hover:shadow-lg hover:shadow-olive-500/30"
                    >
                      {createThreadMutation.isPending ? 'Creating...' : 'Create Thread'}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateThread(false)
                        setThreadTitle('')
                        setThreadContent('')
                      }}
                      className="px-4 py-3.5 glass-effect border border-neutral-800/50 hover:border-neutral-700/50 text-neutral-50 font-semibold rounded-xl transition-all duration-200"
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
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-olive-500/10 rounded-xl border border-olive-500/20">
              <MessageSquare className="w-5 h-5 text-olive-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-50">Discussion Threads</h2>
            <span className="px-3 py-1 bg-neutral-800/50 rounded-full text-neutral-400 text-sm font-medium">({threads?.length || 0})</span>
          </div>

          {threadsError && (
            <div className="bg-error-500/10 border border-error-500/30 rounded-xl p-4 mb-4 card-shadow">
              <p className="text-error-400 text-sm">
                Error loading threads: {threadsError instanceof Error ? threadsError.message : 'Unknown error'}
              </p>
            </div>
          )}
          {threadsLoading ? (
            <div className="text-neutral-400">Loading threads...</div>
          ) : !threads || threads.length === 0 ? (
            <div className="glass-effect border border-neutral-800/50 rounded-2xl p-12 md:p-16 text-center card-shadow">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-500/10 rounded-full mb-6 border border-accent-500/20">
                <MessageSquare className="w-10 h-10 text-accent-400/60" />
              </div>
              <p className="text-neutral-50 text-xl mb-2 font-semibold">No threads yet</p>
              <p className="text-neutral-400 text-sm">
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
                      className="absolute top-3 right-3 p-2 bg-error-600 hover:bg-error-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-error-500/20 hover:shadow-lg hover:shadow-error-500/30"
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

