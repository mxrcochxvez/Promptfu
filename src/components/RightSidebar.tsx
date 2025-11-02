import { Link, useLocation } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { X, Menu, MessageSquare } from 'lucide-react'
import { getCommunitiesForClass, getCommunitiesForUnit, getCommunitiesForLesson } from '../db/queries'

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

interface RightSidebarProps {
  classId?: string
  unitId?: string
  lessonId?: string
}

export default function RightSidebar({ classId, unitId, lessonId }: RightSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  // Only show on class/unit/lesson pages
  const shouldShow = classId && location.pathname.startsWith('/classes/')
  if (!shouldShow) return null

  const classIdNum = classId ? parseInt(classId) : undefined
  const unitIdNum = unitId ? parseInt(unitId) : undefined
  const lessonIdNum = lessonId ? parseInt(lessonId) : undefined

  // Fetch communities based on context
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

  // Organize communities by type
  const communities = classCommunities || []
  const classCommunity = communities.find((c: any) => c.type === 'class')

  // Show unit community if on unit or lesson page
  const unitCommunity = unitIdNum && unitCommunities ? unitCommunities.find((c: any) => c.type === 'unit' && c.unitId === unitIdNum) : null
  
  // Show lesson community if on lesson page
  const lessonCommunity = lessonIdNum && lessonCommunities ? lessonCommunities.find((c: any) => c.type === 'lesson' && c.lessonId === lessonIdNum) : null

  const allCommunities = [
    classCommunity,
    unitCommunity,
    lessonCommunity,
  ].filter(Boolean)

  if (allCommunities.length === 0) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 p-2 hover:bg-gray-700 rounded-lg transition-colors z-40 bg-gray-800 text-white"
        aria-label="Open communities menu"
      >
        <Menu size={24} />
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
          {classCommunity && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Class Community</h3>
              <Link
                to="/communities/$communityId"
                params={{ communityId: classCommunity.id.toString() }}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <MessageSquare size={20} />
                <span className="font-medium">{classCommunity.name}</span>
              </Link>
            </div>
          )}

          {unitCommunity && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Unit Community</h3>
              <Link
                to="/communities/$communityId"
                params={{ communityId: unitCommunity.id.toString() }}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <MessageSquare size={20} />
                <span className="font-medium">{unitCommunity.name}</span>
              </Link>
            </div>
          )}

          {lessonCommunity && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Lesson Community</h3>
              <Link
                to="/communities/$communityId"
                params={{ communityId: lessonCommunity.id.toString() }}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <MessageSquare size={20} />
                <span className="font-medium">{lessonCommunity.name}</span>
              </Link>
            </div>
          )}
        </nav>
      </aside>
    </>
  )
}

