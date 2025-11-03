import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../../contexts/AuthContext'
import MarkdownRenderer from '../../../../components/MarkdownRenderer'
import RightSidebar from '../../../../components/RightSidebar'
import FeedbackForm from '../../../../components/FeedbackForm'
import {
  getUnitById,
  getUnitsByClassId,
  getLessonsByUnitId,
  getUnitCompletion,
  getCompletedLessons,
  getClassById,
  getClassBySlug,
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

const getClassBySlugFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    return await getClassBySlug(data.slug)
  })

const getClass = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { classId: number }) => data)
  .handler(async ({ data }) => {
    return await getClassById(data.classId)
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

export const Route = createFileRoute('/classes/$slug/units/$unitId')({
  component: UnitView,
  beforeLoad: ({ params }) => {
    // Validate unitId
    const unitIdNum = parseInt(params.unitId)
    if (isNaN(unitIdNum)) {
      throw new Error('Invalid unit ID')
    }
  },
})

function UnitView() {
  const { slug, unitId } = Route.useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const location = useLocation()
  const unitIdNum = parseInt(unitId)

  // Check if we're on a child route (lessons)
  const isChildRoute = location.pathname.includes('/lessons/')

  // Validate ID
  if (isNaN(unitIdNum)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-red-400">Invalid unit ID</div>
      </div>
    )
  }

  // First, get class by slug to validate it exists
  const { data: classData, isLoading: classLoading, error: classError } = useQuery({
    queryKey: ['classBySlug', slug],
    queryFn: async () => {
      return await getClassBySlugFn({ data: { slug } })
    },
  })

  const classId = classData?.id

  // Get unit data
  const { data: unit, isLoading: unitLoading, error: unitError } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: async () => {
      return await getUnit({ data: { unitId: unitIdNum } as any })
    },
  })

  // Validate that the unit belongs to the class from the slug
  if (unit && classId && unit.classId !== classId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-red-400">Unit does not belong to this class</div>
      </div>
    )
  }

  const { data: allUnits, error: unitsError } = useQuery({
    queryKey: ['classUnits', slug, classId],
    queryFn: async () => {
      if (!classId) return []
      return await getClassUnits({ data: { classId } as any })
    },
    enabled: !!classId,
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

  if (classLoading || unitLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (classError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-red-400">
          Error loading class: {classError instanceof Error ? classError.message : 'Unknown error'}
        </div>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Class not found</div>
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

  if (!classId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Class ID not found</div>
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
      <RightSidebar classId={slug} unitId={unitId} />
      <div className="min-h-screen bg-gradient-hero py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/classes/$slug"
            params={{ slug }}
            className="text-accent-500 hover:text-accent-400 mb-4 inline-flex items-center gap-2 transition-colors duration-200 font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Class
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-50 mb-4">{unit.title}</h1>
          
          {/* Unit Progress */}
          {user && unitProgress !== undefined && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Progress</span>
                <span className="text-sm font-bold text-olive-400">{unitProgress}%</span>
              </div>
              <ProgressBar progress={unitProgress} />
            </div>
          )}
        </div>

        {/* Unit Description (if exists and no lessons) */}
        {(!lessons || lessons.length === 0) && unit.content && (
          <div className="glass-effect border border-neutral-800/50 rounded-2xl p-8 mb-6 card-shadow">
            <MarkdownRenderer content={unit.content} />
          </div>
        )}

        {/* Lessons Section */}
        {lessons && lessons.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-50 mb-6 flex items-center gap-3">
              <div className="p-2 bg-olive-500/10 rounded-xl border border-olive-500/20">
                <BookOpen className="w-5 h-5 text-olive-400" />
              </div>
              Lessons
            </h2>
            <div className="space-y-3">
              {lessons.map((lesson, index) => {
                const isCompleted = completedLessonIds.has(lesson.id)
                return (
                  <Link
                    key={lesson.id}
                    to="/classes/$slug/units/$unitId/lessons/$lessonId"
                    params={{
                      slug,
                      unitId,
                      lessonId: lesson.id.toString(),
                    }}
                    className="group block glass-effect border border-neutral-800/50 rounded-2xl p-5 hover:border-olive-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-olive-500/10 hover:-translate-y-1 card-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isCompleted && (
                          <CheckCircle2 className="w-5 h-5 text-olive-400 flex-shrink-0" />
                        )}
                        <div className="flex items-center gap-3">
                          <span className="text-neutral-500 text-sm font-medium">
                            Lesson {index + 1}
                          </span>
                          <h3 className="text-neutral-50 font-bold group-hover:text-olive-400 transition-colors">{lesson.title}</h3>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-olive-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : !unit.content ? (
          <div className="glass-effect border border-neutral-800/50 rounded-2xl p-8 mb-6 card-shadow">
            <p className="text-neutral-400">
              This unit doesn't have any lessons yet. Please check back later.
            </p>
          </div>
        ) : null}

        {/* Feedback Form */}
        <FeedbackForm
          classId={classId}
          unitId={unitIdNum}
          className="mb-6"
        />

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-neutral-800/50">
          {prevUnit ? (
            <Link
              to="/classes/$slug/units/$unitId"
              params={{ slug, unitId: prevUnit.id.toString() }}
              className="flex items-center gap-2 text-accent-500 hover:text-accent-400 transition-colors duration-200 font-medium"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous Unit
            </Link>
          ) : (
            <div></div>
          )}

          {nextUnit ? (
            <Link
              to="/classes/$slug/units/$unitId"
              params={{ slug, unitId: nextUnit.id.toString() }}
              className="flex items-center gap-2 text-accent-500 hover:text-accent-400 transition-colors duration-200 font-medium"
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

