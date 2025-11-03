import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '../../../../../../contexts/AuthContext'
import MarkdownRenderer from '../../../../../../components/MarkdownRenderer'
import RightSidebar from '../../../../../../components/RightSidebar'
import FeedbackForm from '../../../../../../components/FeedbackForm'
import {
  getLessonById,
  getLessonsByUnitId,
  isLessonCompleted,
  markLessonComplete,
  getUnitById,
} from '../../../../../../db/queries'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'

const getLesson = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { lessonId: number }) => data)
  .handler(async ({ data }) => {
    try {
      return await getLessonById(data.lessonId)
    } catch (error) {
      console.error('Error in getLesson:', error)
      throw error
    }
  })

const getUnit = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { unitId: number }) => data)
  .handler(async ({ data }) => {
    return await getUnitById(data.unitId)
  })

const getLessons = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { unitId: number }) => data)
  .handler(async ({ data }) => {
    return await getLessonsByUnitId(data.unitId)
  })

const checkLessonComplete = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; lessonId: number }) => data)
  .handler(async ({ data }) => {
    return await isLessonCompleted(data.userId, data.lessonId)
  })

const completeLesson = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; lessonId: number }) => data)
  .handler(async ({ data }) => {
    await markLessonComplete(data.userId, data.lessonId)
    return { success: true }
  })

export const Route = createFileRoute('/classes/$slug/units/$unitId/lessons/$lessonId')({
  component: LessonView,
  beforeLoad: ({ params }) => {
    // Validate IDs
    const unitIdNum = parseInt(params.unitId)
    const lessonIdNum = parseInt(params.lessonId)
    if (isNaN(unitIdNum) || isNaN(lessonIdNum)) {
      throw new Error('Invalid unit or lesson ID')
    }
  },
})

function LessonView() {
  const { slug, unitId, lessonId } = Route.useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const lessonIdNum = parseInt(lessonId)
  const unitIdNum = parseInt(unitId)

  // Validate IDs
  if (isNaN(lessonIdNum) || isNaN(unitIdNum)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-red-400">Invalid lesson or unit ID</div>
      </div>
    )
  }

  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      return await getLesson({ data: { lessonId: lessonIdNum } as any })
    },
  })

  const { data: unit } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: async () => {
      return await getUnit({ data: { unitId: unitIdNum } as any })
    },
  })

  const { data: allLessons } = useQuery({
    queryKey: ['lessons', unitId],
    queryFn: async () => {
      return await getLessons({ data: { unitId: unitIdNum } as any })
    },
  })

  const { data: isCompleted } = useQuery({
    queryKey: ['lessonCompleted', lessonId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false
      return await checkLessonComplete({
        data: { userId: user.id, lessonId: lessonIdNum },
      })
    },
    enabled: !!user?.id,
  })

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      return await completeLesson({
        data: { userId: user.id, lessonId: lessonIdNum },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessonCompleted'] })
      queryClient.invalidateQueries({ queryKey: ['unitCompletion'] })
      queryClient.invalidateQueries({ queryKey: ['classProgress'] })
      queryClient.invalidateQueries({ queryKey: ['enrolledClasses'] })
    },
  })

  // Scroll to top when lesson changes
  useEffect(() => {
    if (!lessonLoading && lesson) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [lessonId, lessonLoading, lesson])

  const handleNextLessonClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (lessonLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading lesson...</div>
      </div>
    )
  }

  if (lessonError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-red-400">
          Error loading lesson: {lessonError instanceof Error ? lessonError.message : 'Unknown error'}
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Lesson not found</div>
      </div>
    )
  }

  const currentIndex = allLessons?.findIndex((l) => l.id === lessonIdNum) ?? -1
  const prevLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null
  const nextLesson =
    allLessons && currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null

  const handleComplete = async () => {
    if (!user || isCompleted) return
    await completeMutation.mutateAsync()
  }

  const classId = unit?.classId

  return (
    <>
      <RightSidebar classId={slug} unitId={unitId} lessonId={lessonId} />
      <div className="min-h-screen bg-gradient-hero py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/classes/$slug/units/$unitId"
            params={{ slug, unitId }}
            className="text-accent-500 hover:text-accent-400 mb-4 inline-flex items-center gap-2 transition-colors duration-200 font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Unit{unit?.title ? `: ${unit.title}` : ''}
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-50 mb-4">{lesson.title}</h1>
        </div>

        {/* Lesson Content */}
        <div className="glass-effect border border-neutral-800/50 rounded-2xl p-8 mb-6 card-shadow">
          <MarkdownRenderer content={lesson.content} />
        </div>

        {/* Feedback Form */}
        <FeedbackForm
          classId={classId!}
          unitId={unitIdNum}
          lessonId={lessonIdNum}
          className="mb-6"
        />

        {/* Signup Prompt for Unauthenticated Users */}
        {!user && (
          <div className="glass-effect border border-olive-500/30 rounded-2xl p-6 mb-6 bg-olive-500/10 card-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-neutral-50 font-bold mb-2">Want to track your progress?</h3>
                <p className="text-neutral-300 text-sm mb-4">
                  Sign up to enroll in this course, mark lessons as complete, and track your learning journey.
                </p>
                <div className="flex gap-3">
                  <Link
                    to="/signup"
                    className="px-4 py-2.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 text-sm shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Sign Up
                  </Link>
                  <Link
                    to="/login"
                    className="px-4 py-2.5 glass-effect border border-neutral-800/50 hover:border-neutral-700/50 text-neutral-50 font-semibold rounded-xl transition-all duration-200 text-sm"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Button */}
        {user && !isCompleted && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              className="px-6 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <CheckCircle2 className="w-5 h-5" />
              {completeMutation.isPending ? 'Marking complete...' : 'Mark as Complete'}
            </button>
          </div>
        )}

        {user && isCompleted && (
          <div className="mb-6 flex justify-center">
            <div className="px-6 py-3.5 bg-olive-500/20 border border-olive-500/40 text-olive-300 rounded-xl flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Completed
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-neutral-800/50">
          {prevLesson ? (
            <Link
              to="/classes/$slug/units/$unitId/lessons/$lessonId"
              params={{ slug, unitId, lessonId: prevLesson.id.toString() }}
              className="flex items-center gap-2 text-accent-500 hover:text-accent-400 transition-colors duration-200 font-medium"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous Lesson
            </Link>
          ) : (
            <div></div>
          )}

          {nextLesson ? (
            <Link
              to="/classes/$slug/units/$unitId/lessons/$lessonId"
              params={{ slug, unitId, lessonId: nextLesson.id.toString() }}
              onClick={handleNextLessonClick}
              className="flex items-center gap-2 text-accent-500 hover:text-accent-400 transition-colors duration-200 font-medium"
            >
              Next Lesson
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

