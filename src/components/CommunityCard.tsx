import { Link } from '@tanstack/react-router'
import { MessageSquare, Users } from 'lucide-react'

interface CommunityCardProps {
  communityId: number
  name: string
  description?: string | null
  type: 'general' | 'class' | 'unit' | 'lesson'
}

export default function CommunityCard({
  communityId,
  name,
  description,
  type,
}: CommunityCardProps) {
  const typeLabels: Record<string, string> = {
    general: 'General',
    class: 'Class',
    unit: 'Unit',
    lesson: 'Lesson',
  }

  const handleClick = (e: React.MouseEvent) => {
    console.log('CommunityCard clicked, communityId:', communityId)
    // Let the Link handle navigation
  }

  return (
    <Link
      to="/communities/$communityId"
      params={{ communityId: communityId.toString() }}
      className="block"
      onClick={handleClick}
    >
      <div className="bg-slate-800 rounded-lg border border-slate-700 rounded-lg p-4 hover:border-olive-500/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-olive-400" />
            <h3 className="text-white font-medium">{name}</h3>
          </div>
          <span className="px-2 py-1 bg-slate-700 text-gray-300 text-xs rounded-full">
            {typeLabels[type]}
          </span>
        </div>
        {description && (
          <p className="text-gray-400 text-sm line-clamp-2">{description}</p>
        )}
      </div>
    </Link>
  )
}

