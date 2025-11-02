import { createFileRoute, Link } from '@tanstack/react-router'
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
} from '../../../../db/queries'
import { ChevronLeft, MessageSquare, Send } from 'lucide-react'
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

export const Route = createFileRoute('/communities/$communityId/threads/$threadId')({
  component: ThreadDetail,
})

function ThreadDetail() {
  const { communityId, threadId } = Route.useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
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
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-4">{thread.title}</h1>
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
                  content={item.reply.content}
                  author={item.author}
                  createdAt={item.reply.createdAt}
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

