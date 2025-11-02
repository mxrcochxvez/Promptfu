import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { submitFeedback } from '../lib/api/feedback'
import { MessageSquare, Bug, BookOpen, ThumbsUp, ThumbsDown } from 'lucide-react'

interface FeedbackFormProps {
  classId?: number
  unitId?: number
  lessonId?: number
  className?: string
}

export default function FeedbackForm({
  classId,
  unitId,
  lessonId,
  className = '',
}: FeedbackFormProps) {
  const { user } = useAuth()
  const [feedbackType, setFeedbackType] = useState<'bug' | 'coursework'>('coursework')
  const [sentiment, setSentiment] = useState<'positive' | 'negative'>('positive')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  if (!user) {
    return (
      <div className={`bg-slate-800 border border-slate-700 rounded-lg p-6 ${className}`}>
        <p className="text-gray-400">Please sign in to provide feedback.</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      setMessage({ type: 'error', text: 'Please enter your feedback.' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const result = await submitFeedback({
        data: {
          token,
          feedbackType,
          sentiment,
          content: content.trim(),
          classId: classId || null,
          unitId: unitId || null,
          lessonId: lessonId || null,
        },
      })

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Thank you for your feedback! We appreciate your input.',
        })
        setContent('')
        // Reset form after success
        setTimeout(() => setMessage(null), 5000)
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to submit feedback.' })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to submit feedback.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getResourceContext = () => {
    if (lessonId) return 'lesson'
    if (unitId) return 'unit'
    if (classId) return 'class'
    return null
  }

  const resourceContext = getResourceContext()

  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-olive-400" />
        <h3 className="text-lg font-semibold text-white">Provide Feedback</h3>
      </div>

      {resourceContext && (
        <div className="mb-4 p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
          <p className="text-sm text-gray-300">
            Providing feedback for this <span className="font-medium capitalize">{resourceContext}</span>
          </p>
        </div>
      )}

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/50 text-green-400'
              : 'bg-red-500/10 border border-red-500/50 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Feedback Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                feedbackType === 'coursework'
                  ? 'bg-olive-500/20 border-olive-500'
                  : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
              }`}
            >
              <input
                type="radio"
                name="feedbackType"
                value="coursework"
                checked={feedbackType === 'coursework'}
                onChange={(e) => setFeedbackType(e.target.value as 'bug' | 'coursework')}
                className="mr-2"
              />
              <BookOpen className="w-4 h-4 text-olive-400" />
              <span className="text-gray-200">Coursework</span>
            </label>
            <label
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                feedbackType === 'bug'
                  ? 'bg-olive-500/20 border-olive-500'
                  : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
              }`}
            >
              <input
                type="radio"
                name="feedbackType"
                value="bug"
                checked={feedbackType === 'bug'}
                onChange={(e) => setFeedbackType(e.target.value as 'bug' | 'coursework')}
                className="mr-2"
              />
              <Bug className="w-4 h-4 text-red-400" />
              <span className="text-gray-200">Bug</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Sentiment</label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                sentiment === 'positive'
                  ? 'bg-green-500/20 border-green-500'
                  : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
              }`}
            >
              <input
                type="radio"
                name="sentiment"
                value="positive"
                checked={sentiment === 'positive'}
                onChange={(e) => setSentiment(e.target.value as 'positive' | 'negative')}
                className="mr-2"
              />
              <ThumbsUp className="w-4 h-4 text-green-400" />
              <span className="text-gray-200">Positive</span>
            </label>
            <label
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                sentiment === 'negative'
                  ? 'bg-red-500/20 border-red-500'
                  : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
              }`}
            >
              <input
                type="radio"
                name="sentiment"
                value="negative"
                checked={sentiment === 'negative'}
                onChange={(e) => setSentiment(e.target.value as 'positive' | 'negative')}
                className="mr-2"
              />
              <ThumbsDown className="w-4 h-4 text-red-400" />
              <span className="text-gray-200">Negative</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
            Feedback
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-olive-500 resize-none"
            placeholder="Share your thoughts, suggestions, or report issues..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="w-full px-4 py-2 bg-olive-500 hover:bg-olive-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4" />
              <span>Submit Feedback</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}

