import { Link } from '@tanstack/react-router'
import { MessageSquare, Clock } from 'lucide-react'

interface ThreadCardProps {
  threadId: number
  communityId: number
  title: string
  author: {
    id: number
    email: string
    firstName?: string | null
    lastName?: string | null
  }
  createdAt: Date | string
  replyCount?: number
}

export default function ThreadCard({
  threadId,
  communityId,
  title,
  author,
  createdAt,
  replyCount = 0,
}: ThreadCardProps) {
  const authorName =
    author.firstName || author.lastName
      ? `${author.firstName || ''} ${author.lastName || ''}`.trim()
      : author.email

  const date = new Date(createdAt)
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })

  return (
    <Link
      to="/communities/$communityId/threads/$threadId"
      params={{
        communityId: communityId.toString(),
        threadId: threadId.toString(),
      }}
      className="block relative"
    >
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-olive-500/50 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-white font-medium flex-1">{title}</h3>
          <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>by {authorName}</span>
          <span>•</span>
          <span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
          <div className="flex items-center gap-1 ml-auto">
            <Clock className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

