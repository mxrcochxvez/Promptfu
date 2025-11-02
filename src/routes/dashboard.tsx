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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-400 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Please sign in to view your dashboard</p>
          <p className="text-gray-400 text-sm">You will be redirected automatically...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Welcome back, {user.firstName || user.lastName || user.email}!
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-olive-500"
            />
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-6 h-6 text-olive-400" />
            <h2 className="text-2xl font-semibold text-white">My Classes</h2>
            <span className="text-gray-400">({enrolledClasses.length})</span>
          </div>

          {enrolledLoading ? (
            <div className="text-gray-400">Loading your classes...</div>
          ) : filteredEnrolled.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No classes enrolled yet</p>
              <p className="text-gray-500 text-sm">
                Browse available classes below to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEnrolled.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  classId={classItem.id}
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
          <div className="flex items-center gap-2 mb-6">
            <Search className="w-6 h-6 text-olive-400" />
            <h2 className="text-2xl font-semibold text-white">Available Classes</h2>
            <span className="text-gray-400">({availableClasses.length})</span>
          </div>

          {availableLoading ? (
            <div className="text-gray-400">Loading available classes...</div>
          ) : filteredAvailable.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
              <p className="text-gray-400 text-lg">No available classes at the moment</p>
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
