import { Link, useLocation } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { X, MessageCircle, MessageSquare, Clock } from 'lucide-react'
import { getCommunitiesForClass, getCommunitiesForUnit, getCommunitiesForLesson, getCommunityThreads } from '../db/queries'

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
  classId?: string
  unitId?: string
  lessonId?: string
}

export default function RightSidebar({ classId, unitId, lessonId }: RightSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const classIdNum = classId ? parseInt(classId) : undefined
  const unitIdNum = unitId ? parseInt(unitId) : undefined
  const lessonIdNum = lessonId ? parseInt(lessonId) : undefined

  // Fetch communities based on context - all hooks must be called before any returns
  const { data: classCommunities } = useQuery({
    queryKey: ['classCommunities', classId],
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
  const shouldShow = classId && location.pathname.startsWith('/classes/')
  if (!shouldShow || !relevantCommunity) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 p-2 hover:bg-gray-700 rounded-lg transition-colors z-40 bg-gray-800 text-white"
        aria-label="Open communities menu"
      >
        <MessageCircle size={24} />
      </button>

      <aside
        className={`fixed top-0 right-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Communities</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
              {relevantCommunity.type === 'lesson' ? 'Lesson' : relevantCommunity.type === 'unit' ? 'Unit' : 'Class'} Community
            </h3>
            <Link
              to="/communities/$communityId"
              params={{ communityId: relevantCommunity.id.toString() }}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-4"
            >
              <MessageSquare size={20} />
              <span className="font-medium">{relevantCommunity.name}</span>
            </Link>
          </div>

          {/* Threads List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase">Recent Posts</h3>
              <span className="text-xs text-gray-500">{threads?.length || 0}</span>
            </div>
            {!threads || threads.length === 0 ? (
              <p className="text-sm text-gray-500">No posts yet</p>
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
                      className="block p-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <div className="text-sm font-medium text-white mb-1 line-clamp-2">
                        {item.thread.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
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

