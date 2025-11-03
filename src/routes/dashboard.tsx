import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import ClassCard from '../components/ClassCard';
import { BookOpen, Search } from 'lucide-react';
import React, { useState } from 'react';
import {
  getUserEnrollments,
  getAvailableClasses,
  getClassCompletion,
} from '../db/queries';

const getEnrolledClassesForUser = createServerFn({
  method: 'POST',
})
  .inputValidator((data: number) => data)
  .handler(async ({ data }) => {
    if (!data) return { classes: [] }

    const enrollments = await getUserEnrollments(data)
    const classesWithProgress = await Promise.all(
      enrollments.map(async (e) => {
        const progress = await getClassCompletion(data, e.class.id)
        return {
          ...e.class,
          progress,
        }
      })
    )

    return { classes: classesWithProgress }
  })

const getAvailableClassesForUser = createServerFn({
  method: 'POST',
})
  .inputValidator((data: number) => data)
  .handler(async ({ data }) => {
    if (!data) return { classes: [] }

    const classes = await getAvailableClasses(data)
    // Add hasContent check for each class
    const classesWithContent = await Promise.all(
      classes.map(async (classItem) => {
        const { getUnitsByClassId, getTestsByClassId } = await import('../db/queries')
        const units = await getUnitsByClassId(classItem.id)
        const tests = await getTestsByClassId(classItem.id)
        return {
          ...classItem,
          hasContent: units.length > 0 || tests.length > 0,
        }
      })
    )
    return { classes: classesWithContent }
  })

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { user, isLoading } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  // All hooks must be called before any early returns
  const { data: enrolledData, isLoading: enrolledLoading } = useQuery({
    queryKey: ['enrolledClasses', user?.id],
    queryFn: async () => {
      if (!user?.id) return { classes: [] }
      return await getEnrolledClassesForUser({ data: user.id })
    },
    enabled: !!user?.id && !isLoading,
  })

  const { data: availableData, isLoading: availableLoading } = useQuery({
    queryKey: ['availableClasses', user?.id],
    queryFn: async () => {
      if (!user?.id) return { classes: [] }
      return await getAvailableClassesForUser({ data: user.id })
    },
    enabled: !!user?.id && !isLoading,
  })

  const enrolledClasses = enrolledData?.classes || []
  const availableClasses = availableData?.classes || []

  const filteredEnrolled = enrolledClasses.filter(
    (c) =>
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredAvailable = availableClasses.filter(
    (c) =>
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-olive-500/30 border-t-olive-500 mx-auto mb-4"></div>
          <p className="text-neutral-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center glass-effect rounded-2xl p-8 card-shadow">
          <p className="text-neutral-50 text-xl mb-4 font-semibold">Please sign in to view your dashboard</p>
          <p className="text-neutral-400 text-sm">You will be redirected automatically...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-50 mb-2">Dashboard</h1>
          <p className="text-neutral-400 text-base md:text-lg">
            Welcome back, {user.firstName || user.lastName || user.email}!
          </p>
        </div>

        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 glass-effect border border-neutral-800/50 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200"
            />
          </div>
        </div>

        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-olive-500/10 rounded-xl border border-olive-500/20">
              <BookOpen className="w-5 h-5 text-olive-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-50">My Classes</h2>
            <span className="px-3 py-1 bg-neutral-800/50 rounded-full text-neutral-400 text-sm font-medium">
              {enrolledClasses.length}
            </span>
          </div>

          {enrolledLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-effect rounded-2xl overflow-hidden border border-neutral-800/50 card-shadow">
                  <div className="w-full h-52 skeleton"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-5 skeleton rounded"></div>
                    <div className="h-4 skeleton rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEnrolled.length === 0 ? (
            <div className="glass-effect border border-neutral-800/50 rounded-2xl p-12 md:p-16 text-center card-shadow">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-olive-500/10 rounded-full mb-6 border border-olive-500/20">
                <BookOpen className="w-10 h-10 text-olive-400/60" />
              </div>
              <p className="text-neutral-50 text-xl mb-3 font-semibold">No classes enrolled yet</p>
              <p className="text-neutral-400 text-sm max-w-md mx-auto">
                Browse available classes below to get started on your learning journey
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEnrolled.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  classId={classItem.id}
                  slug={classItem.slug}
                  title={classItem.title}
                  description={classItem.description}
                  thumbnailUrl={classItem.thumbnailUrl}
                  progress={classItem.progress}
                  isEnrolled={true}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-accent-500/10 rounded-xl border border-accent-500/20">
              <Search className="w-5 h-5 text-accent-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-50">Available Classes</h2>
            <span className="px-3 py-1 bg-neutral-800/50 rounded-full text-neutral-400 text-sm font-medium">
              {availableClasses.length}
            </span>
          </div>

          {availableLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-effect rounded-2xl overflow-hidden border border-neutral-800/50 card-shadow">
                  <div className="w-full h-52 skeleton"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-5 skeleton rounded"></div>
                    <div className="h-4 skeleton rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAvailable.length === 0 ? (
            <div className="glass-effect border border-neutral-800/50 rounded-2xl p-12 md:p-16 text-center card-shadow">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-500/10 rounded-full mb-6 border border-accent-500/20">
                <Search className="w-10 h-10 text-accent-400/60" />
              </div>
              <p className="text-neutral-50 text-xl mb-3 font-semibold">No available classes at the moment</p>
              <p className="text-neutral-400 text-sm max-w-md mx-auto">
                Check back soon for new learning opportunities
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAvailable.map((classItem: any) => {
                // Check if coming soon (no units or tests)
                const isComingSoon = !classItem.hasContent
                return (
                  <ClassCard
                    key={classItem.id}
                    classId={classItem.id}
                    slug={classItem.slug}
                    title={classItem.title}
                    description={classItem.description}
                    thumbnailUrl={classItem.thumbnailUrl}
                    isEnrolled={false}
                    isComingSoon={isComingSoon}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
