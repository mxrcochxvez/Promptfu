import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import ProgressBar from '../../components/ProgressBar'
import RightSidebar from '../../components/RightSidebar'
import {
  getClassById,
  getUnitsByClassId,
  getTestsByClassId,
  isUserEnrolled,
  enrollUserInClass,
  getClassCompletion,
  getUnitCompletion,
  hasCompletedTest,
} from '../../db/queries'
import { BookOpen, PlayCircle, CheckCircle2, ArrowRight } from 'lucide-react'

function UnitCard({
  unit,
  index,
  classId,
  userId,
  getUnitProgress,
}: {
  unit: { id: number; title: string }
  index: number
  classId: string
  userId?: number
  getUnitProgress: any
}) {
  const { data: unitProgress } = useQuery({
    queryKey: ['unitProgress', unit.id, userId],
    queryFn: async () => {
      if (!userId) return 0
      return await getUnitProgress({ data: { userId, unitId: unit.id } as any })
    },
    enabled: !!userId,
  })

  return (
    <Link
      to="/classes/$classId/units/$unitId"
      params={{
        classId: classId.toString(),
        unitId: unit.id.toString(),
      }}
      className="block bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-olive-500/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm font-medium">
            Unit {index + 1}
          </span>
          <h3 className="text-white font-medium">{unit.title}</h3>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400" />
      </div>
      {userId && unitProgress !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-400 text-xs">Progress</span>
            <span className="text-olive-400 text-xs font-semibold">{unitProgress}%</span>
          </div>
          <ProgressBar progress={unitProgress} />
        </div>
      )}
    </Link>
  )
}

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

const getClassTests = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { classId: number }) => data)
  .handler(async ({ data }) => {
    return await getTestsByClassId(data.classId)
  })

const checkEnrollment = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; classId: number }) => data)
  .handler(async ({ data }) => {
    return await isUserEnrolled(data.userId, data.classId)
  })

const enrollInClass = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; classId: number }) => data)
  .handler(async ({ data }) => {
    await enrollUserInClass(data.userId, data.classId)
    return { success: true }
  })

const getCompletion = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; classId: number }) => data)
  .handler(async ({ data }) => {
    return await getClassCompletion(data.userId, data.classId)
  })

const getUnitProgress = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; unitId: number }) => data)
  .handler(async ({ data }) => {
    return await getUnitCompletion(data.userId, data.unitId)
  })

export const Route = createFileRoute('/classes/$classId')({
  component: ClassDetail,
})

function ClassDetail() {
  const { classId } = Route.useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const location = useLocation()
  const classIdNum = parseInt(classId)
  
  // Check if we're on a child route (units or tests)
  const isChildRoute = location.pathname.includes('/units/') || location.pathname.includes('/tests/')

  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', classId],
    queryFn: async () => {
      return await getClass({ data: { classId: classIdNum } as any })
    },
  })

  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ['classUnits', classId],
    queryFn: async () => {
      return await getClassUnits({ data: { classId: classIdNum } as any })
    },
  })

  const { data: tests, isLoading: testsLoading } = useQuery({
    queryKey: ['classTests', classId],
    queryFn: async () => {
      return await getClassTests({ data: { classId: classIdNum } as any })
    },
  })

  const { data: isEnrolled } = useQuery({
    queryKey: ['isEnrolled', classId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false
      return await checkEnrollment({
        data: { userId: user.id, classId: classIdNum },
      })
    },
    enabled: !!user?.id,
  })

  const { data: progress } = useQuery({
    queryKey: ['classProgress', classId, user?.id],
    queryFn: async () => {
      if (!user?.id) return 0
      return await getCompletion({
        data: { userId: user.id, classId: classIdNum },
      })
    },
    enabled: !!user?.id && isEnrolled === true,
  })

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      return await enrollInClass({
        data: { userId: user.id, classId: classIdNum },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isEnrolled'] })
      queryClient.invalidateQueries({ queryKey: ['enrolledClasses'] })
      queryClient.invalidateQueries({ queryKey: ['availableClasses'] })
    },
  })

  if (classLoading || unitsLoading || testsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
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

  const handleEnroll = async () => {
    if (!user) return
    await enrollMutation.mutateAsync()
  }

  // If we're on a child route, just render the outlet
  if (isChildRoute) {
    return <Outlet />
  }

  return (
    <>
      <RightSidebar classId={classId} />
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
        <div className="max-w-5xl mx-auto">
        {/* Class Header */}
        <div className="mb-8">
          {classData.thumbnailUrl && (
            <div className="w-full h-64 mb-6 rounded-xl overflow-hidden">
              <img
                src={classData.thumbnailUrl}
                alt={classData.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h1 className="text-4xl font-bold text-white mb-4">{classData.title}</h1>
          {classData.description && (
            <p className="text-gray-300 text-lg mb-6">{classData.description}</p>
          )}

          {isEnrolled && progress !== undefined && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Progress</span>
                <span className="text-olive-400 font-semibold">{progress}%</span>
              </div>
              <ProgressBar progress={progress} />
            </div>
          )}

          {!isEnrolled && user && (
            <button
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="px-6 py-3 bg-olive-500 hover:bg-olive-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enrollMutation.isPending ? 'Enrolling...' : 'Enroll in Class'}
            </button>
          )}

          {isEnrolled && units && units.length > 0 && (
            <Link
              to="/classes/$classId/units/$unitId"
              params={{
                classId: classId,
                unitId: units[0].id.toString(),
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-olive-500 hover:bg-olive-600 text-white font-semibold rounded-lg transition-colors"
            >
              <PlayCircle className="w-5 h-5" />
              Continue Learning
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}

          {/* Coming Soon Message */}
          {(!units || units.length === 0) && (!tests || tests.length === 0) && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1 bg-olive-500/20 border border-olive-500 rounded-full">
                  <span className="text-olive-400 text-sm font-semibold">Coming Soon</span>
                </div>
              </div>
              <p className="text-gray-300">
                This course is currently being developed. Check back soon for updates!
              </p>
            </div>
          )}
        </div>

        {/* Units Section */}
        {units && units.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-olive-400" />
              Units
            </h2>
            <div className="space-y-3">
              {units.map((unit, index) => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  index={index}
                  classId={classId}
                  userId={user?.id}
                  getUnitProgress={getUnitProgress}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tests Section */}
        {tests && tests.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-olive-400" />
              Tests & Assessments
            </h2>
            <div className="space-y-3">
              {tests.map((test) => (
                <Link
                  key={test.id}
                  to="/classes/$classId/tests/$testId"
                  params={{
                    classId: classId,
                    testId: test.id.toString(),
                  }}
                  className="block bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-olive-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium mb-1">{test.title}</h3>
                      {test.description && (
                        <p className="text-gray-400 text-sm">{test.description}</p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  )
}
