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
      className="block relative group"
    >
      <div className="glass-effect border border-neutral-800/50 rounded-xl p-5 hover:border-olive-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-olive-500/10 hover:-translate-y-1 card-shadow">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-neutral-50 font-bold flex-1 group-hover:text-olive-400 transition-colors">{title}</h3>
          <MessageSquare className="w-5 h-5 text-neutral-400 group-hover:text-olive-400 flex-shrink-0 ml-2 transition-colors" />
        </div>
        <div className="flex items-center gap-3 text-sm text-neutral-400">
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

