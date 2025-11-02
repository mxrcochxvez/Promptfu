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
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-olive-500 rounded-full text-white font-semibold text-sm">
            {authorName[0].toUpperCase()}
          </div>
          <span className="text-white font-medium">{authorName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-400">
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
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
              title="Delete reply"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="text-gray-300">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  )
}

