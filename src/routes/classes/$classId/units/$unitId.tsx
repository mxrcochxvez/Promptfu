import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../../contexts/AuthContext'
import MarkdownRenderer from '../../../../components/MarkdownRenderer'
import {
  getUnitById,
  getUnitsByClassId,
  getLessonsByUnitId,
  isUnitCompleted,
  markUnitComplete,
} from '../../../../db/queries'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'

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

const checkUnitComplete = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; unitId: number }) => data)
  .handler(async ({ data }) => {
    return await isUnitCompleted(data.userId, data.unitId)
  })

const completeUnit = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; unitId: number }) => data)
  .handler(async ({ data }) => {
    await markUnitComplete(data.userId, data.unitId)
    return { success: true }
  })

export const Route = createFileRoute('/classes/$classId/units/$unitId')({
  component: UnitView,
})

function UnitView() {
  const { classId, unitId } = Route.useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const unitIdNum = parseInt(unitId)
  const classIdNum = parseInt(classId)

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

  const { data: isCompleted } = useQuery({
    queryKey: ['unitCompleted', unitId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false
      return await checkUnitComplete({
        data: { userId: user.id, unitId: unitIdNum },
      })
    },
    enabled: !!user?.id,
  })

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      return await completeUnit({
        data: { userId: user.id, unitId: unitIdNum },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unitCompleted'] })
      queryClient.invalidateQueries({ queryKey: ['classProgress'] })
      queryClient.invalidateQueries({ queryKey: ['enrolledClasses'] })
    },
  })

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
            to="/classes/$classId"
            params={{ classId }}
            className="text-olive-400 hover:text-olive-300 mb-4 inline-flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Class
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{unit.title}</h1>
        </div>

        {/* Lessons Content */}
        {lessons && lessons.length > 0 ? (
          <div className="space-y-8 mb-6">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-8"
              >
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {index + 1}. {lesson.title}
                </h2>
                <div className="prose prose-invert max-w-none">
                  <MarkdownRenderer content={lesson.content} />
                </div>
              </div>
            ))}
          </div>
        ) : unit.content ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-6">
            <MarkdownRenderer content={unit.content} />
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-6">
            <p className="text-gray-400">
              This unit doesn't have any content yet. Please check back later.
            </p>
          </div>
        )}

        {/* Complete Button */}
        {user && !isCompleted && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              {completeMutation.isPending ? 'Marking complete...' : 'Mark as Complete'}
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="mb-6 flex justify-center">
            <div className="px-6 py-3 bg-green-500/20 border border-green-500 text-green-400 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Completed
            </div>
          </div>
        )}

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
  )
}
