import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { createServerFn, createMiddleware } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { requireAdmin } from '../../lib/auth'
import { getAllFeedbackFn, getFeedbackStatsFn } from '../../lib/api/feedback'
import { useState } from 'react'
import {
  MessageSquare,
  Bug,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Filter,
  BarChart3,
} from 'lucide-react'

const adminMiddleware = createMiddleware().server(async ({ next, request }) => {
  requireAdmin(request)
  return next()
})

const getFeedback = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .handler(async ({ data: { token } }) => {
    return await getAllFeedbackFn({ data: { token } })
  })

const getStats = createServerFn({
  method: 'POST',
})
  .middleware([adminMiddleware])
  .handler(async ({ data: { token } }) => {
    return await getFeedbackStatsFn({ data: { token } })
  })

export const Route = createFileRoute('/admin/feedback')({
  component: AdminFeedbackDashboard,
})

function AdminFeedbackDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [filterType, setFilterType] = useState<'all' | 'bug' | 'coursework'>('all')
  const [filterSentiment, setFilterSentiment] = useState<'all' | 'positive' | 'negative'>('all')

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate({ to: '/dashboard' })
    return null
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  const { data: feedbackResult, isLoading: feedbackLoading } = useQuery({
    queryKey: ['adminFeedback', filterType, filterSentiment],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      return await getFeedback({ data: { token } })
    },
    enabled: !!token && !!user?.isAdmin,
  })

  const { data: statsResult, isLoading: statsLoading } = useQuery({
    queryKey: ['adminFeedbackStats'],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      return await getStats({ data: { token } })
    },
    enabled: !!token && !!user?.isAdmin,
  })

  const feedback = feedbackResult?.success ? feedbackResult.feedback : []
  const stats = statsResult?.success ? statsResult.stats : null

  // Apply filters
  const filteredFeedback = feedback.filter((item: any) => {
    if (filterType !== 'all' && item.feedback.feedbackType !== filterType) return false
    if (filterSentiment !== 'all' && item.feedback.sentiment !== filterSentiment) return false
    return true
  })

  const getResourceLink = (item: any) => {
    if (item.lesson) {
      return `/classes/${item.class?.id}/units/${item.unit?.id}/lessons/${item.lesson.id}`
    }
    if (item.unit) {
      return `/classes/${item.class?.id}/units/${item.unit.id}`
    }
    if (item.class) {
      return `/classes/${item.class.id}`
    }
    return null
  }

  const getResourceName = (item: any) => {
    if (item.lesson) return `Lesson: ${item.lesson.title}`
    if (item.unit) return `Unit: ${item.unit.title}`
    if (item.class) return `Class: ${item.class.title}`
    return 'General'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-olive-400" />
            Feedback Dashboard
          </h1>
        </div>

        {/* Statistics Section */}
        {stats && !statsLoading && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-olive-400" />
                <span className="text-gray-400 text-sm">Total Feedback</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.total || 0}</p>
            </div>

            {stats.byTypeAndSentiment?.map((stat: any) => (
              <div
                key={`${stat.feedbackType}-${stat.sentiment}`}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  {stat.feedbackType === 'bug' ? (
                    <Bug className="w-5 h-5 text-red-400" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-blue-400" />
                  )}
                  {stat.sentiment === 'positive' ? (
                    <ThumbsUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <ThumbsDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-gray-400 text-sm capitalize">
                    {stat.feedbackType} ({stat.sentiment})
                  </span>
                </div>
                <p className="text-3xl font-bold text-white">{stat.count || 0}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300 font-medium">Filters:</span>
            </div>

            <div>
              <label className="text-sm text-gray-400 mr-2">Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-olive-500"
              >
                <option value="all">All</option>
                <option value="bug">Bug</option>
                <option value="coursework">Coursework</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mr-2">Sentiment:</label>
              <select
                value={filterSentiment}
                onChange={(e) => setFilterSentiment(e.target.value as any)}
                className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-olive-500"
              >
                <option value="all">All</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        {feedbackLoading ? (
          <div className="text-gray-400">Loading feedback...</div>
        ) : filteredFeedback.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No feedback found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedback.map((item: any) => {
              const resourceLink = getResourceLink(item)
              const resourceName = getResourceName(item)
              const userName =
                item.user.firstName || item.user.lastName
                  ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim()
                  : item.user.email

              return (
                <div
                  key={item.feedback.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-olive-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      {item.feedback.feedbackType === 'bug' ? (
                        <Bug className="w-5 h-5 text-red-400 flex-shrink-0" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{userName}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400 text-sm">
                            {new Date(item.feedback.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {resourceLink ? (
                          <Link
                            to={resourceLink}
                            className="text-olive-400 hover:text-olive-300 text-sm"
                          >
                            {resourceName}
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-sm">{resourceName}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.feedback.sentiment === 'positive' ? (
                        <div className="px-2 py-1 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-xs font-medium flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          Positive
                        </div>
                      ) : (
                        <div className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs font-medium flex items-center gap-1">
                          <ThumbsDown className="w-3 h-3" />
                          Negative
                        </div>
                      )}
                      <div className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-gray-300 text-xs capitalize">
                        {item.feedback.feedbackType}
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-700/50 border border-slate-600 rounded p-4">
                    <p className="text-gray-200 whitespace-pre-wrap">{item.feedback.content}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

