import { Clock, Trash2 } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'

interface ReplyCardProps {
  replyId?: number
  content: string
  author: {
    id: number
    email: string
    firstName?: string | null
    lastName?: string | null
  }
  createdAt: Date | string
  onDelete?: (replyId: number) => void
  showDelete?: boolean
  isDeleting?: boolean
}

export default function ReplyCard({ replyId, content, author, createdAt, onDelete, showDelete, isDeleting }: ReplyCardProps) {
  const authorName =
    author.firstName || author.lastName
      ? `${author.firstName || ''} ${author.lastName || ''}`.trim()
      : author.email

  const date = new Date(createdAt)
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="glass-effect border border-neutral-800/50 rounded-xl p-5 relative card-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-olive-500 to-olive-600 rounded-full text-white font-semibold text-sm shadow-lg shadow-olive-500/20">
            {authorName[0].toUpperCase()}
          </div>
          <span className="text-neutral-50 font-bold">{authorName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-neutral-400">
            <Clock className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
          {showDelete && replyId && onDelete && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this reply? This action cannot be undone.')) {
                  onDelete(replyId)
                }
              }}
              disabled={isDeleting}
              className="p-2 bg-error-600 hover:bg-error-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2 shadow-md shadow-error-500/20 hover:shadow-lg hover:shadow-error-500/30"
              title="Delete reply"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="text-neutral-200">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  )
}

