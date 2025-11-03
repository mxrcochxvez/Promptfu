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
      className="block group"
      onClick={handleClick}
    >
      <div className="glass-effect rounded-2xl border border-neutral-800/50 p-6 hover:border-olive-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-olive-500/10 hover:-translate-y-1 card-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-olive-500/10 rounded-xl border border-olive-500/20 group-hover:bg-olive-500/20 transition-colors">
              <MessageSquare className="w-4 h-4 text-olive-400" />
            </div>
            <h3 className="text-neutral-50 font-bold group-hover:text-olive-400 transition-colors">{name}</h3>
          </div>
          <span className="px-2.5 py-1 bg-neutral-800/50 text-neutral-400 text-xs font-medium rounded-full border border-neutral-800/50">
            {typeLabels[type]}
          </span>
        </div>
        {description && (
          <p className="text-neutral-400 text-sm line-clamp-2 leading-relaxed">{description}</p>
        )}
      </div>
    </Link>
  )
}

