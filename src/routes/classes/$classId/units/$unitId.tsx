import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../../contexts/AuthContext'
import MarkdownRenderer from '../../../../components/MarkdownRenderer'
import RightSidebar from '../../../../components/RightSidebar'
import {
  getUnitById,
  getUnitsByClassId,
  getLessonsByUnitId,
  getUnitCompletion,
  getCompletedLessons,
} from '../../../../db/queries'
import { ChevronLeft, ChevronRight, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react'
import ProgressBar from '../../../../components/ProgressBar'

const getUnit = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { unitId: number }) => data)
  .handler(async ({ data }) => {
    try {
      return await getUnitById(data.unitId)
    } catch (error) {
      console.error('Error in getUnit:', error)
      throw error
    }
  })

const getClassUnits = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { classId: number }) => data)
  .handler(async ({ data }) => {
    return await getUnitsByClassId(data.classId)
  })

const getLessons = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { unitId: number }) => data)
  .handler(async ({ data }) => {
    return await getLessonsByUnitId(data.unitId)
  })

const getUnitProgress = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; unitId: number }) => data)
  .handler(async ({ data }) => {
    return await getUnitCompletion(data.userId, data.unitId)
  })

const getCompletedLessonsList = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; unitId: number }) => data)
  .handler(async ({ data }) => {
    return await getCompletedLessons(data.userId, data.unitId)
  })

export const Route = createFileRoute('/classes/$classId/units/$unitId')({
  component: UnitView,
  beforeLoad: ({ params }) => {
    // Ensure params are valid
    const classIdNum = parseInt(params.classId)
    const unitIdNum = parseInt(params.unitId)
    if (isNaN(classIdNum) || isNaN(unitIdNum)) {
      throw new Error('Invalid class or unit ID')
    }
  },
})

function UnitView() {
  const { classId, unitId } = Route.useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const location = useLocation()
  const unitIdNum = parseInt(unitId)
  const classIdNum = parseInt(classId)

  // Check if we're on a child route (lessons)
  const isChildRoute = location.pathname.includes('/lessons/')

  // Validate IDs
  if (isNaN(unitIdNum) || isNaN(classIdNum)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-red-400">Invalid unit or class ID</div>
      </div>
    )
  }

  const { data: unit, isLoading: unitLoading, error: unitError } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: async () => {
      return await getUnit({ data: { unitId: unitIdNum } as any })
    },
  })

  const { data: allUnits, error: unitsError } = useQuery({
    queryKey: ['classUnits', classId],
    queryFn: async () => {
      return await getClassUnits({ data: { classId: classIdNum } as any })
    },
  })

  const { data: lessons, error: lessonsError } = useQuery({
    queryKey: ['lessons', unitId],
    queryFn: async () => {
      return await getLessons({ data: { unitId: unitIdNum } as any })
    },
  })

  const { data: unitProgress } = useQuery({
    queryKey: ['unitCompletion', unitId, user?.id],
    queryFn: async () => {
      if (!user?.id) return 0
      return await getUnitProgress({
        data: { userId: user.id, unitId: unitIdNum },
      })
    },
    enabled: !!user?.id,
  })

  const { data: completedLessonsList } = useQuery({
    queryKey: ['completedLessons', unitId, user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      return await getCompletedLessonsList({
        data: { userId: user.id, unitId: unitIdNum },
      })
    },
    enabled: !!user?.id,
  })

  const completedLessonIds = new Set(completedLessonsList?.map((l: any) => l.lessonId) || [])

  // If we're on a child route (lessons), just render the outlet
  if (isChildRoute) {
    return <Outlet />
  }

  if (unitLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading unit...</div>
      </div>
    )
  }

  if (unitError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-red-400">
          Error loading unit: {unitError instanceof Error ? unitError.message : 'Unknown error'}
        </div>
      </div>
    )
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Unit not found</div>
      </div>
    )
  }

  const currentIndex = allUnits?.findIndex((u) => u.id === unitIdNum) ?? -1
  const prevUnit = currentIndex > 0 ? allUnits?.[currentIndex - 1] : null
  const nextUnit =
    allUnits && currentIndex >= 0 && currentIndex < allUnits.length - 1
      ? allUnits[currentIndex + 1]
      : null


  return (
    <>
      <RightSidebar classId={classId} unitId={unitId} />
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/classes/$classId"
            params={{ classId }}
            className="text-olive-400 hover:text-olive-300 mb-4 inline-flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Class
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{unit.title}</h1>
          
          {/* Unit Progress */}
          {user && unitProgress !== undefined && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Progress</span>
                <span className="text-olive-400 font-semibold">{unitProgress}%</span>
              </div>
              <ProgressBar progress={unitProgress} />
            </div>
          )}
        </div>

        {/* Unit Description (if exists and no lessons) */}
        {(!lessons || lessons.length === 0) && unit.content && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-6">
            <MarkdownRenderer content={unit.content} />
          </div>
        )}

        {/* Lessons Section */}
        {lessons && lessons.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-olive-400" />
              Lessons
            </h2>
            <div className="space-y-3">
              {lessons.map((lesson, index) => {
                const isCompleted = completedLessonIds.has(lesson.id)
                return (
                  <Link
                    key={lesson.id}
                    to="/classes/$classId/units/$unitId/lessons/$lessonId"
                    params={{
                      classId,
                      unitId,
                      lessonId: lesson.id.toString(),
                    }}
                    className="block bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-olive-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isCompleted && (
                          <CheckCircle2 className="w-5 h-5 text-olive-400 flex-shrink-0" />
                        )}
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm font-medium">
                            Lesson {index + 1}
                          </span>
                          <h3 className="text-white font-medium">{lesson.title}</h3>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : !unit.content ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-6">
            <p className="text-gray-400">
              This unit doesn't have any lessons yet. Please check back later.
            </p>
          </div>
        ) : null}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-700">
          {prevUnit ? (
            <Link
              to="/classes/$classId/units/$unitId"
              params={{ classId, unitId: prevUnit.id.toString() }}
              className="flex items-center gap-2 text-olive-400 hover:text-olive-300"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous Unit
            </Link>
          ) : (
            <div></div>
          )}

          {nextUnit ? (
            <Link
              to="/classes/$classId/units/$unitId"
              params={{ classId, unitId: nextUnit.id.toString() }}
              className="flex items-center gap-2 text-olive-400 hover:text-olive-300"
            >
              Next Unit
              <ChevronRight className="w-5 h-5" />
            </Link>
          ) : (
            <div></div>
          )}
        </div>
        </div>
      </div>
    </>
  )
}
