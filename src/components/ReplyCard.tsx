import { Clock } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'

interface ReplyCardProps {
  content: string
  author: {
    id: number
    email: string
    firstName?: string | null
    lastName?: string | null
  }
  createdAt: Date | string
}

export default function ReplyCard({ content, author, createdAt }: ReplyCardProps) {
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
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-olive-500 rounded-full text-white font-semibold text-sm">
            {authorName[0].toUpperCase()}
          </div>
          <span className="text-white font-medium">{authorName}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>{formattedDate}</span>
        </div>
      </div>
      <div className="text-gray-300">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  )
}

