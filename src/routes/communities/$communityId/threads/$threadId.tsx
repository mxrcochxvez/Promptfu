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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading thread...</div>
      </div>
    )
  }

  if (!threadData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Thread not found</div>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          to="/communities/$communityId"
          params={{ communityId }}
          className="text-olive-400 hover:text-olive-300 mb-6 inline-flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to {community?.name || 'Community'}
        </Link>

        {/* Thread */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6 relative">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-white flex-1">{thread.title}</h1>
            {user?.isAdmin && (
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this thread? This will also delete all replies. This action cannot be undone.')) {
                    await deleteThreadMutation.mutateAsync()
                  }
                }}
                disabled={deleteThreadMutation.isPending}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                title="Delete thread"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 mb-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-olive-500 rounded-full text-white font-semibold text-xs">
                {authorName[0].toUpperCase()}
              </div>
              <span>{authorName}</span>
            </div>
            <span>•</span>
            <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="text-gray-300">
            <MarkdownRenderer content={thread.content} />
          </div>
        </div>

        {/* Replies Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-olive-400" />
            <h2 className="text-xl font-semibold text-white">Replies</h2>
            <span className="text-gray-400">({replies?.length || 0})</span>
          </div>

          {repliesLoading ? (
            <div className="text-gray-400">Loading replies...</div>
          ) : !replies || replies.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
              <p className="text-gray-400">No replies yet. Be the first to reply!</p>
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
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Add a Reply</h3>
            <div className="space-y-4">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                rows={6}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-olive-500"
              />
              <button
                onClick={handleCreateReply}
                disabled={createReplyMutation.isPending || !replyContent.trim()}
                className="px-6 py-3 bg-olive-500 hover:bg-olive-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                {createReplyMutation.isPending ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-olive-500/10 border border-olive-500/50 rounded-lg p-6 text-center">
            <p className="text-gray-300 mb-4">Please sign in to reply to this thread</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2 bg-olive-500 hover:bg-olive-600 text-white font-semibold rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

