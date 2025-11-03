import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../../contexts/AuthContext'
import ReplyCard from '../../../../components/ReplyCard'
import MarkdownRenderer from '../../../../components/MarkdownRenderer'
import {
  getThreadById,
  getThreadReplies,
  createReply,
  getCommunityById,
  deleteThread,
  deleteReply,
} from '../../../../db/queries'
import { ChevronLeft, MessageSquare, Send, Trash2 } from 'lucide-react'
import { requireAdmin } from '../../../../lib/auth'
import { createMiddleware } from '@tanstack/react-start'
import { useState } from 'react'

const getThread = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { threadId: number }) => data)
  .handler(async ({ data }) => {
    return await getThreadById(data.threadId)
  })

const getReplies = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { threadId: number }) => data)
  .handler(async ({ data }) => {
    return await getThreadReplies(data.threadId)
  })

const getCommunity = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { communityId: number }) => data)
  .handler(async ({ data }) => {
    return await getCommunityById(data.communityId)
  })

const createNewReply = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { threadId: number; authorId: number; content: string }) => data)
  .handler(async ({ data }) => {
    return await createReply(data)
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

const deleteReplyFn = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .inputValidator((data: { replyId: number }) => data)
  .handler(async ({ data }) => {
    await deleteReply(data.replyId)
    return { success: true }
  })

export const Route = createFileRoute('/communities/$communityId/threads/$threadId')({
  component: ThreadDetail,
})

function ThreadDetail() {
  const { communityId, threadId } = Route.useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const communityIdNum = parseInt(communityId)
  const threadIdNum = parseInt(threadId)

  const [replyContent, setReplyContent] = useState('')

  const { data: threadData, isLoading: threadLoading } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: async () => {
      return await getThread({ data: { threadId: threadIdNum } })
    },
  })

  const { data: replies, isLoading: repliesLoading } = useQuery({
    queryKey: ['threadReplies', threadId],
    queryFn: async () => {
      return await getReplies({ data: { threadId: threadIdNum } })
    },
  })

  const { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      return await getCommunity({ data: { communityId: communityIdNum } })
    },
  })

  const createReplyMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      if (!replyContent.trim()) throw new Error('Content required')
      return await createNewReply({
        data: {
          threadId: threadIdNum,
          authorId: user.id,
          content: replyContent.trim(),
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threadReplies'] })
      setReplyContent('')
    },
  })

  const deleteThreadMutation = useMutation({
    mutationFn: async () => {
      return await deleteThreadFn({ data: { threadId: threadIdNum } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityThreads'] })
      queryClient.invalidateQueries({ queryKey: ['thread'] })
      navigate({ to: '/communities/$communityId', params: { communityId } })
    },
  })

  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      return await deleteReplyFn({ data: { replyId } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threadReplies'] })
      queryClient.invalidateQueries({ queryKey: ['communityThreads'] })
    },
  })

  if (threadLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-olive-500/30 border-t-olive-500 mx-auto mb-4"></div>
          <div className="text-neutral-300">Loading thread...</div>
        </div>
      </div>
    )
  }

  if (!threadData) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-neutral-50">Thread not found</div>
      </div>
    )
  }

  const { thread, author } = threadData
  const authorName =
    author.firstName || author.lastName
      ? `${author.firstName || ''} ${author.lastName || ''}`.trim()
      : author.email

  const handleCreateReply = async () => {
    await createReplyMutation.mutateAsync()
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          to="/communities/$communityId"
          params={{ communityId }}
          className="text-accent-500 hover:text-accent-400 mb-6 inline-flex items-center gap-2 transition-colors duration-200 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to {community?.name || 'Community'}
        </Link>

        {/* Thread */}
        <div className="glass-effect border border-neutral-800/50 rounded-2xl p-6 mb-6 relative card-shadow">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-50 flex-1">{thread.title}</h1>
            {user?.isAdmin && (
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this thread? This will also delete all replies. This action cannot be undone.')) {
                    await deleteThreadMutation.mutateAsync()
                  }
                }}
                disabled={deleteThreadMutation.isPending}
                className="p-2 bg-error-600 hover:bg-error-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-4 shadow-md shadow-error-500/20 hover:shadow-lg hover:shadow-error-500/30"
                title="Delete thread"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 mb-4 text-sm text-neutral-400">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-olive-500 to-olive-600 rounded-full text-white font-semibold text-xs shadow-lg shadow-olive-500/20">
                {authorName[0].toUpperCase()}
              </div>
              <span className="text-neutral-300">{authorName}</span>
            </div>
            <span>•</span>
            <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="text-neutral-200">
            <MarkdownRenderer content={thread.content} />
          </div>
        </div>

        {/* Replies Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent-500/10 rounded-xl border border-accent-500/20">
              <MessageSquare className="w-5 h-5 text-accent-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-neutral-50">Replies</h2>
            <span className="px-3 py-1 bg-neutral-800/50 rounded-full text-neutral-400 text-sm font-medium">({replies?.length || 0})</span>
          </div>

          {repliesLoading ? (
            <div className="text-neutral-400">Loading replies...</div>
          ) : !replies || replies.length === 0 ? (
            <div className="glass-effect border border-neutral-800/50 rounded-2xl p-12 md:p-16 text-center card-shadow">
              <p className="text-neutral-400">No replies yet. Be the first to reply!</p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {replies.map((item: any) => (
                <ReplyCard
                  key={item.reply.id}
                  replyId={item.reply.id}
                  content={item.reply.content}
                  author={item.author}
                  createdAt={item.reply.createdAt}
                  showDelete={user?.isAdmin}
                  onDelete={(replyId) => deleteReplyMutation.mutate(replyId)}
                  isDeleting={deleteReplyMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Reply Form */}
        {user ? (
          <div className="glass-effect border border-neutral-800/50 rounded-2xl p-6 card-shadow">
            <h3 className="text-neutral-50 font-bold mb-4">Add a Reply</h3>
            <div className="space-y-4">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                rows={6}
                className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200 resize-none"
              />
              <button
                onClick={handleCreateReply}
                disabled={createReplyMutation.isPending || !replyContent.trim()}
                className="px-6 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Send className="w-5 h-5" />
                {createReplyMutation.isPending ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-effect border border-olive-500/30 rounded-2xl p-6 text-center bg-olive-500/10 card-shadow">
            <p className="text-neutral-300 mb-4">Please sign in to reply to this thread</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

