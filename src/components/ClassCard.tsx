import { Link } from '@tanstack/react-router'
import ProgressBar from './ProgressBar'
import { BookOpen } from 'lucide-react'

interface ClassCardProps {
  classId: number
  title: string
  description?: string | null
  thumbnailUrl?: string | null
  progress?: number // 0-100, optional
  isEnrolled?: boolean
  isComingSoon?: boolean
}

export default function ClassCard({
  classId,
  title,
  description,
  thumbnailUrl,
  progress,
  isEnrolled = false,
  isComingSoon = false,
}: ClassCardProps) {
  return (
    <Link
      to="/classes/$classId"
      params={{ classId: classId.toString() }}
      className="block"
    >
      <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-olive-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-olive-500/10 relative">
        {isComingSoon && (
          <div className="absolute top-3 right-3 z-10">
            <div className="px-3 py-1 bg-olive-500/20 border border-olive-500 rounded-full">
              <span className="text-olive-400 text-xs font-semibold">Coming Soon</span>
            </div>
          </div>
        )}
        {thumbnailUrl && (
          <div className="w-full h-48 overflow-hidden bg-slate-700">
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {!thumbnailUrl && (
          <div className="w-full h-48 bg-gradient-to-br from-olive-500/20 to-blue-500/20 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-olive-400/50" />
          </div>
        )}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          {description && (
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{description}</p>
          )}
          {isEnrolled && progress !== undefined && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Progress</span>
                <span className="text-sm font-medium text-olive-400">{progress}%</span>
              </div>
              <ProgressBar progress={progress} />
            </div>
          )}
          {!isEnrolled && !isComingSoon && (
            <span className="text-olive-400 text-sm font-medium">View Class →</span>
          )}
        </div>
      </div>
    </Link>
  )
}
