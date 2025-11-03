import { Link } from '@tanstack/react-router'
import ProgressBar from './ProgressBar'
import { BookOpen } from 'lucide-react'

interface ClassCardProps {
  classId: number
  slug?: string // Slug is optional for backward compatibility, will use classId if not provided
  title: string
  description?: string | null
  thumbnailUrl?: string | null
  progress?: number // 0-100, optional
  isEnrolled?: boolean
  isComingSoon?: boolean
}

export default function ClassCard({
  classId,
  slug,
  title,
  description,
  thumbnailUrl,
  progress,
  isEnrolled = false,
  isComingSoon = false,
}: ClassCardProps) {
  // Use slug if provided, otherwise fall back to classId (for backward compatibility during transition)
  const routeParam = slug || classId.toString()
  
  return (
    <Link
      to="/classes/$slug"
      params={{ slug: routeParam }}
      className="block group"
    >
      <div className="glass-effect rounded-2xl overflow-hidden border border-neutral-800/50 hover:border-olive-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-olive-500/10 hover:-translate-y-1 relative card-shadow">
        {isComingSoon && (
          <div className="absolute top-4 right-4 z-10">
            <div className="px-3 py-1.5 bg-gradient-to-r from-olive-500/20 to-olive-400/20 border border-olive-500/40 rounded-full backdrop-blur-sm">
              <span className="text-olive-300 text-xs font-semibold">Coming Soon</span>
            </div>
          </div>
        )}
        {thumbnailUrl && (
          <div className="w-full h-52 overflow-hidden bg-neutral-900 relative">
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-neutral-950/0 to-transparent"></div>
          </div>
        )}
        {!thumbnailUrl && (
          <div className="w-full h-52 bg-gradient-to-br from-olive-500/20 via-olive-500/10 to-accent-500/10 flex items-center justify-center group-hover:from-olive-500/30 group-hover:via-olive-500/20 group-hover:to-accent-500/20 transition-all duration-500">
            <BookOpen className="w-16 h-16 text-olive-400/60 group-hover:text-olive-400 group-hover:scale-110 transition-all duration-300" />
          </div>
        )}
        <div className="p-6">
          <h3 className="text-xl font-bold text-neutral-50 mb-2 group-hover:text-olive-400 transition-colors">{title}</h3>
          {description && (
            <p className="text-neutral-400 text-sm mb-4 line-clamp-2 leading-relaxed">{description}</p>
          )}
          {isEnrolled && progress !== undefined && (
            <div className="mt-5">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Progress</span>
                <span className="text-sm font-bold text-olive-400">{progress}%</span>
              </div>
              <ProgressBar progress={progress} />
            </div>
          )}
          {!isEnrolled && !isComingSoon && (
            <div className="mt-4 flex items-center gap-2 text-accent-500 text-sm font-semibold group-hover:gap-3 transition-all">
              <span>View Class</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
