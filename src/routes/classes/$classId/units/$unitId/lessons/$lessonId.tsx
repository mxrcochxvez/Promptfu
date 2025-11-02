import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../../../../contexts/AuthContext'
import MarkdownRenderer from '../../../../../../components/MarkdownRenderer'
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

export const Route = createFileRoute('/classes/$classId/units/$unitId/lessons/$lessonId')({
  component: LessonView,
  beforeLoad: ({ params }) => {
    // Ensure params are valid
    const classIdNum = parseInt(params.classId)
    const unitIdNum = parseInt(params.unitId)
    const lessonIdNum = parseInt(params.lessonId)
    if (isNaN(classIdNum) || isNaN(unitIdNum) || isNaN(lessonIdNum)) {
      throw new Error('Invalid class, unit, or lesson ID')
    }
  },
})

function LessonView() {
  const { classId, unitId, lessonId } = Route.useParams()
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/classes/$classId/units/$unitId"
            params={{ classId, unitId }}
            className="text-olive-400 hover:text-olive-300 mb-4 inline-flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Unit{unit?.title ? `: ${unit.title}` : ''}
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{lesson.title}</h1>
        </div>

        {/* Lesson Content */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-6">
          <MarkdownRenderer content={lesson.content} />
        </div>

        {/* Complete Button */}
        {user && !isCompleted && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              className="px-6 py-3 bg-olive-500 hover:bg-olive-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              {completeMutation.isPending ? 'Marking complete...' : 'Mark as Complete'}
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="mb-6 flex justify-center">
            <div className="px-6 py-3 bg-olive-500/20 border border-olive-500 text-olive-400 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Completed
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-700">
          {prevLesson ? (
            <Link
              to="/classes/$classId/units/$unitId/lessons/$lessonId"
              params={{ classId, unitId, lessonId: prevLesson.id.toString() }}
              className="flex items-center gap-2 text-olive-400 hover:text-olive-300"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous Lesson
            </Link>
          ) : (
            <div></div>
          )}

          {nextLesson ? (
            <Link
              to="/classes/$classId/units/$unitId/lessons/$lessonId"
              params={{ classId, unitId, lessonId: nextLesson.id.toString() }}
              className="flex items-center gap-2 text-olive-400 hover:text-olive-300"
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
  )
}

