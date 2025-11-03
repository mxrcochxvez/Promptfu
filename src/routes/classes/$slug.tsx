import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import ProgressBar from '../../components/ProgressBar'
import RightSidebar from '../../components/RightSidebar'
import FeedbackForm from '../../components/FeedbackForm'
import {
  getClassBySlug,
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
  slug,
  userId,
  getUnitProgress,
}: {
  unit: { id: number; title: string }
  index: number
  slug: string
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
      to="/classes/$slug/units/$unitId"
      params={{
        slug: slug,
        unitId: unit.id.toString(),
      }}
      className="group block glass-effect border border-neutral-800/50 rounded-xl p-5 hover:border-olive-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-olive-500/10 hover:-translate-y-1 card-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-neutral-500 text-sm font-medium">
            Unit {index + 1}
          </span>
          <h3 className="text-neutral-50 font-bold group-hover:text-olive-400 transition-colors">{unit.title}</h3>
        </div>
        <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-olive-400 group-hover:translate-x-1 transition-all" />
      </div>
      {userId && unitProgress !== undefined && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Progress</span>
            <span className="text-sm font-bold text-olive-400">{unitProgress}%</span>
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
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    return await getClassBySlug(data.slug)
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

export const Route = createFileRoute('/classes/$slug')({
  component: ClassDetail,
})

function ClassDetail() {
  const { slug } = Route.useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const location = useLocation()
  
  // Check if we're on a child route (units or tests)
  const isChildRoute = location.pathname.includes('/units/') || location.pathname.includes('/tests/')

  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', slug],
    queryFn: async () => {
      return await getClass({ data: { slug } })
    },
  })

  // Get classId from classData for queries that need numeric ID
  const classId = classData?.id

  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ['classUnits', slug, classId],
    queryFn: async () => {
      if (!classId) return []
      return await getClassUnits({ data: { classId } as any })
    },
    enabled: !!classId,
  })

  const { data: tests, isLoading: testsLoading } = useQuery({
    queryKey: ['classTests', slug, classId],
    queryFn: async () => {
      if (!classId) return []
      return await getClassTests({ data: { classId } as any })
    },
    enabled: !!classId,
  })

  const { data: isEnrolled } = useQuery({
    queryKey: ['isEnrolled', slug, classId, user?.id],
    queryFn: async () => {
      if (!user?.id || !classId) return false
      return await checkEnrollment({
        data: { userId: user.id, classId },
      })
    },
    enabled: !!user?.id && !!classId,
  })

  const { data: progress } = useQuery({
    queryKey: ['classProgress', slug, classId, user?.id],
    queryFn: async () => {
      if (!user?.id || !classId) return 0
      return await getCompletion({
        data: { userId: user.id, classId },
      })
    },
    enabled: !!user?.id && isEnrolled === true && !!classId,
  })

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !classId) throw new Error('Not authenticated or class not found')
      return await enrollInClass({
        data: { userId: user.id, classId },
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
      <RightSidebar classId={slug} />
      <div className="min-h-screen bg-gradient-hero py-8 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
        {/* Class Header */}
        <div className="mb-8">
          {classData.thumbnailUrl && (
            <div className="w-full h-64 mb-6 rounded-2xl overflow-hidden card-shadow">
              <img
                src={classData.thumbnailUrl}
                alt={classData.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-50 mb-4">{classData.title}</h1>
          {classData.description && (
            <p className="text-neutral-300 text-lg mb-6 leading-relaxed">{classData.description}</p>
          )}

          {isEnrolled && progress !== undefined && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Progress</span>
                <span className="text-sm font-bold text-olive-400">{progress}%</span>
              </div>
              <ProgressBar progress={progress} />
            </div>
          )}

          {!isEnrolled && user && (
            <button
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="px-6 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              {enrollMutation.isPending ? 'Enrolling...' : 'Enroll in Class'}
            </button>
          )}

          {isEnrolled && units && units.length > 0 && (
            <Link
              to="/classes/$slug/units/$unitId"
              params={{
                slug: slug,
                unitId: units[0].id.toString(),
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlayCircle className="w-5 h-5" />
              Continue Learning
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}

          {/* Coming Soon Message */}
          {(!units || units.length === 0) && (!tests || tests.length === 0) && (
            <div className="glass-effect border border-neutral-800/50 rounded-2xl p-6 mb-6 card-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1.5 bg-gradient-to-r from-olive-500/20 to-olive-400/20 border border-olive-500/40 rounded-full backdrop-blur-sm">
                  <span className="text-olive-300 text-sm font-semibold">Coming Soon</span>
                </div>
              </div>
              <p className="text-neutral-300">
                This course is currently being developed. Check back soon for updates!
              </p>
            </div>
          )}
        </div>

        {/* Units Section */}
        {units && units.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-50 mb-6 flex items-center gap-3">
              <div className="p-2 bg-olive-500/10 rounded-xl border border-olive-500/20">
                <BookOpen className="w-5 h-5 text-olive-400" />
              </div>
              Units
            </h2>
            <div className="space-y-3">
              {units.map((unit, index) => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  index={index}
                  slug={slug}
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
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-50 mb-6 flex items-center gap-3">
              <div className="p-2 bg-accent-500/10 rounded-xl border border-accent-500/20">
                <CheckCircle2 className="w-5 h-5 text-accent-400" />
              </div>
              Tests & Assessments
            </h2>
            <div className="space-y-3">
              {tests.map((test) => (
                <Link
                  key={test.id}
                  to="/classes/$slug/tests/$testId"
                  params={{
                    slug: slug,
                    testId: test.id.toString(),
                  }}
                  className="group block glass-effect border border-neutral-800/50 rounded-2xl p-5 hover:border-olive-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-olive-500/10 hover:-translate-y-1 card-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-neutral-50 font-bold mb-1 group-hover:text-olive-400 transition-colors">{test.title}</h3>
                      {test.description && (
                        <p className="text-neutral-400 text-sm">{test.description}</p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-olive-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Form */}
        <FeedbackForm
          classId={classId!}
          className="mt-8"
        />
        </div>
      </div>
    </>
  )
}

