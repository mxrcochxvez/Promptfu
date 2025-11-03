import { Link, useLocation } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { X, MessageCircle, MessageSquare, Clock } from 'lucide-react'
import { getCommunitiesForClass, getCommunitiesForUnit, getCommunitiesForLesson, getCommunityThreads, getClassBySlug } from '../db/queries'

const getClassBySlugFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    return await getClassBySlug(data.slug)
  })

const getClassCommunities = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { classId: number }) => data)
  .handler(async ({ data }) => {
    return await getCommunitiesForClass(data.classId)
  })

const getUnitCommunities = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { unitId: number }) => data)
  .handler(async ({ data }) => {
    return await getCommunitiesForUnit(data.unitId)
  })

const getLessonCommunities = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { lessonId: number }) => data)
  .handler(async ({ data }) => {
    return await getCommunitiesForLesson(data.lessonId)
  })

const getThreads = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { communityId: number }) => data)
  .handler(async ({ data }) => {
    return await getCommunityThreads(data.communityId)
  })

interface RightSidebarProps {
  classId?: string // Now accepts slug string
  unitId?: string
  lessonId?: string
}

export default function RightSidebar({ classId: slug, unitId, lessonId }: RightSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const unitIdNum = unitId ? parseInt(unitId) : undefined
  const lessonIdNum = lessonId ? parseInt(lessonId) : undefined

  // Get class data from slug to get classId
  const { data: classData } = useQuery({
    queryKey: ['classBySlug', slug],
    queryFn: async () => {
      if (!slug) return null
      return await getClassBySlugFn({ data: { slug } })
    },
    enabled: !!slug,
  })

  const classIdNum = classData?.id

  // Fetch communities based on context - all hooks must be called before any returns
  const { data: classCommunities } = useQuery({
    queryKey: ['classCommunities', slug, classIdNum],
    queryFn: async () => {
      if (!classIdNum) return []
      return await getClassCommunities({ data: { classId: classIdNum } })
    },
    enabled: !!classIdNum,
  })

  const { data: unitCommunities } = useQuery({
    queryKey: ['unitCommunities', unitId],
    queryFn: async () => {
      if (!unitIdNum) return []
      return await getUnitCommunities({ data: { unitId: unitIdNum } })
    },
    enabled: !!unitIdNum,
  })

  const { data: lessonCommunities } = useQuery({
    queryKey: ['lessonCommunities', lessonId],
    queryFn: async () => {
      if (!lessonIdNum) return []
      return await getLessonCommunities({ data: { lessonId: lessonIdNum } })
    },
    enabled: !!lessonIdNum,
  })

  // Show only the relevant community for the current page context
  // Priority: lesson > unit > class
  let relevantCommunity = null
  
  if (lessonIdNum && lessonCommunities) {
    // On lesson page: show lesson community
    relevantCommunity = lessonCommunities.find((c: any) => c.type === 'lesson' && c.lessonId === lessonIdNum)
  } else if (unitIdNum && unitCommunities) {
    // On unit page: show unit community
    relevantCommunity = unitCommunities.find((c: any) => c.type === 'unit' && c.unitId === unitIdNum)
  } else if (classIdNum && classCommunities) {
    // On class page: show class community
    const communities = classCommunities || []
    relevantCommunity = communities.find((c: any) => c.type === 'class')
  }

  // Fetch threads for the relevant community - must be called unconditionally
  const { data: threads } = useQuery({
    queryKey: ['communityThreads', relevantCommunity?.id],
    queryFn: async () => {
      if (!relevantCommunity?.id) return []
      return await getThreads({ data: { communityId: relevantCommunity.id } })
    },
    enabled: !!relevantCommunity?.id,
  })

  // Only show on class/unit/lesson pages - check after all hooks are called
  const shouldShow = slug && location.pathname.startsWith('/classes/')
  if (!shouldShow || !relevantCommunity) return null

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 p-3 hover:bg-neutral-800/50 rounded-xl transition-all duration-200 z-40 glass-effect border border-neutral-800/50 text-neutral-200 hover:scale-105 focus-ring shadow-lg card-shadow"
        aria-label="Open communities menu"
      >
        <MessageCircle size={22} />
      </button>

      <aside
        className={`fixed top-0 right-0 h-full w-80 glass-effect text-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/50">
          <h2 className="text-lg font-bold text-neutral-50">Communities</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-neutral-800/50 rounded-lg transition-all duration-200 hover:scale-110 focus-ring"
            aria-label="Close menu"
          >
            <X size={20} className="text-neutral-300" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              {relevantCommunity.type === 'lesson' ? 'Lesson' : relevantCommunity.type === 'unit' ? 'Unit' : 'Class'} Community
            </h3>
            <Link
              to="/communities/$communityId"
              params={{ communityId: relevantCommunity.id.toString() }}
              onClick={() => setIsOpen(false)}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-800/40 transition-all duration-200 mb-4 border border-neutral-800/50"
            >
              <MessageSquare size={20} className="text-neutral-300 group-hover:text-olive-400 transition-colors" />
              <span className="font-medium text-neutral-200">{relevantCommunity.name}</span>
            </Link>
          </div>

          {/* Threads List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Recent Posts</h3>
              <span className="px-2 py-0.5 bg-neutral-800/50 rounded-full text-xs text-neutral-400 font-medium">{threads?.length || 0}</span>
            </div>
            {!threads || threads.length === 0 ? (
              <p className="text-sm text-neutral-500">No posts yet</p>
            ) : (
              <div className="space-y-2">
                {threads.slice(0, 10).map((item: any) => {
                  const authorName =
                    item.author.firstName || item.author.lastName
                      ? `${item.author.firstName || ''} ${item.author.lastName || ''}`.trim()
                      : item.author.email
                  const date = new Date(item.thread.createdAt)
                  const formattedDate = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                  
                  return (
                    <Link
                      key={item.thread.id}
                      to="/communities/$communityId/threads/$threadId"
                      params={{
                        communityId: relevantCommunity.id.toString(),
                        threadId: item.thread.id.toString(),
                      }}
                      onClick={() => setIsOpen(false)}
                      className="group block p-3 rounded-xl hover:bg-neutral-800/40 transition-all duration-200 border border-transparent hover:border-neutral-800/50"
                    >
                      <div className="text-sm font-medium text-neutral-50 mb-1.5 line-clamp-2 group-hover:text-olive-400 transition-colors">
                        {item.thread.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <span className="truncate">{authorName}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{formattedDate}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  )
}

