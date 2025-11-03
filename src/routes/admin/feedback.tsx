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
    <div className="min-h-screen bg-gradient-hero py-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-50 flex items-center gap-3">
            <div className="p-2 bg-olive-500/10 rounded-xl border border-olive-500/20">
              <MessageSquare className="w-6 h-6 text-olive-400" />
            </div>
            Feedback Dashboard
          </h1>
        </div>

        {/* Statistics Section */}
        {stats && !statsLoading && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-effect border border-neutral-800/50 rounded-2xl p-6 card-shadow">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-olive-400" />
                <span className="text-neutral-400 text-sm font-medium">Total Feedback</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-neutral-50">{stats.total || 0}</p>
            </div>

            {stats.byTypeAndSentiment?.map((stat: any) => (
              <div
                key={`${stat.feedbackType}-${stat.sentiment}`}
                className="glass-effect border border-neutral-800/50 rounded-2xl p-6 card-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  {stat.feedbackType === 'bug' ? (
                    <Bug className="w-5 h-5 text-error-400" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-accent-400" />
                  )}
                  {stat.sentiment === 'positive' ? (
                    <ThumbsUp className="w-4 h-4 text-success-400" />
                  ) : (
                    <ThumbsDown className="w-4 h-4 text-error-400" />
                  )}
                  <span className="text-neutral-400 text-sm font-medium capitalize">
                    {stat.feedbackType} ({stat.sentiment})
                  </span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-neutral-50">{stat.count || 0}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 glass-effect border border-neutral-800/50 rounded-2xl p-4 card-shadow">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-neutral-400" />
              <span className="text-neutral-300 font-medium">Filters:</span>
            </div>

            <div>
              <label className="text-sm text-neutral-400 mr-2">Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 text-sm focus-ring focus:border-olive-500/50 transition-all duration-200"
              >
                <option value="all">All</option>
                <option value="bug">Bug</option>
                <option value="coursework">Coursework</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-neutral-400 mr-2">Sentiment:</label>
              <select
                value={filterSentiment}
                onChange={(e) => setFilterSentiment(e.target.value as any)}
                className="px-3 py-2 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 text-sm focus-ring focus:border-olive-500/50 transition-all duration-200"
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
          <div className="text-neutral-400">Loading feedback...</div>
        ) : filteredFeedback.length === 0 ? (
          <div className="glass-effect border border-neutral-800/50 rounded-2xl p-12 md:p-16 text-center card-shadow">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-500/10 rounded-full mb-6 border border-accent-500/20">
              <MessageSquare className="w-10 h-10 text-accent-400/60" />
            </div>
            <p className="text-neutral-50 text-xl font-semibold">No feedback found</p>
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
                  className="glass-effect border border-neutral-800/50 rounded-2xl p-6 hover:border-olive-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-olive-500/10 card-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      {item.feedback.feedbackType === 'bug' ? (
                        <div className="p-2 bg-error-500/10 rounded-xl border border-error-500/20">
                          <Bug className="w-5 h-5 text-error-400 flex-shrink-0" />
                        </div>
                      ) : (
                        <div className="p-2 bg-accent-500/10 rounded-xl border border-accent-500/20">
                          <BookOpen className="w-5 h-5 text-accent-400 flex-shrink-0" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-neutral-50 font-bold">{userName}</span>
                          <span className="text-neutral-600">•</span>
                          <span className="text-neutral-400 text-sm">
                            {new Date(item.feedback.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {resourceLink ? (
                          <Link
                            to={resourceLink}
                            className="text-accent-500 hover:text-accent-400 text-sm transition-colors duration-200 font-medium"
                          >
                            {resourceName}
                          </Link>
                        ) : (
                          <span className="text-neutral-400 text-sm">{resourceName}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.feedback.sentiment === 'positive' ? (
                        <div className="px-2.5 py-1 bg-success-500/20 border border-success-500/40 rounded-full text-success-400 text-xs font-medium flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          Positive
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 bg-error-500/20 border border-error-500/40 rounded-full text-error-400 text-xs font-medium flex items-center gap-1">
                          <ThumbsDown className="w-3 h-3" />
                          Negative
                        </div>
                      )}
                      <div className="px-2.5 py-1 bg-neutral-800/50 border border-neutral-800/50 rounded-full text-neutral-300 text-xs font-medium capitalize">
                        {item.feedback.feedbackType}
                      </div>
                    </div>
                  </div>
                  <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-4">
                    <p className="text-neutral-200 whitespace-pre-wrap leading-relaxed">{item.feedback.content}</p>
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

