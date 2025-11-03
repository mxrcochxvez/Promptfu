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
      <div className={`glass-effect border border-neutral-800/50 rounded-2xl p-6 card-shadow ${className}`}>
        <p className="text-neutral-400">Please sign in to provide feedback.</p>
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
    <div className={`glass-effect border border-neutral-800/50 rounded-2xl p-6 card-shadow ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-olive-500/10 rounded-xl border border-olive-500/20">
          <MessageSquare className="w-5 h-5 text-olive-400" />
        </div>
        <h3 className="text-lg font-bold text-neutral-50">Provide Feedback</h3>
      </div>

      {resourceContext && (
        <div className="mb-6 p-4 bg-neutral-900/50 border border-neutral-800/50 rounded-xl">
          <p className="text-sm text-neutral-300">
            Providing feedback for this <span className="font-semibold capitalize">{resourceContext}</span>
          </p>
        </div>
      )}

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-success-500/10 border border-success-500/30 text-success-400'
              : 'bg-error-500/10 border border-error-500/30 text-error-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-3">
            Feedback Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                feedbackType === 'coursework'
                  ? 'bg-olive-500/20 border-olive-500/40 shadow-md shadow-olive-500/10'
                  : 'bg-neutral-900/50 border-neutral-800/50 hover:border-neutral-700/50'
              }`}
            >
              <input
                type="radio"
                name="feedbackType"
                value="coursework"
                checked={feedbackType === 'coursework'}
                onChange={(e) => setFeedbackType(e.target.value as 'bug' | 'coursework')}
                className="hidden"
              />
              <BookOpen className={`w-5 h-5 ${feedbackType === 'coursework' ? 'text-olive-400' : 'text-neutral-400'}`} />
              <span className={`font-medium ${feedbackType === 'coursework' ? 'text-neutral-50' : 'text-neutral-300'}`}>Coursework</span>
            </label>
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                feedbackType === 'bug'
                  ? 'bg-error-500/20 border-error-500/40 shadow-md shadow-error-500/10'
                  : 'bg-neutral-900/50 border-neutral-800/50 hover:border-neutral-700/50'
              }`}
            >
              <input
                type="radio"
                name="feedbackType"
                value="bug"
                checked={feedbackType === 'bug'}
                onChange={(e) => setFeedbackType(e.target.value as 'bug' | 'coursework')}
                className="hidden"
              />
              <Bug className={`w-5 h-5 ${feedbackType === 'bug' ? 'text-error-400' : 'text-neutral-400'}`} />
              <span className={`font-medium ${feedbackType === 'bug' ? 'text-neutral-50' : 'text-neutral-300'}`}>Bug</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-3">Sentiment</label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                sentiment === 'positive'
                  ? 'bg-success-500/20 border-success-500/40 shadow-md shadow-success-500/10'
                  : 'bg-neutral-900/50 border-neutral-800/50 hover:border-neutral-700/50'
              }`}
            >
              <input
                type="radio"
                name="sentiment"
                value="positive"
                checked={sentiment === 'positive'}
                onChange={(e) => setSentiment(e.target.value as 'positive' | 'negative')}
                className="hidden"
              />
              <ThumbsUp className={`w-5 h-5 ${sentiment === 'positive' ? 'text-success-400' : 'text-neutral-400'}`} />
              <span className={`font-medium ${sentiment === 'positive' ? 'text-neutral-50' : 'text-neutral-300'}`}>Positive</span>
            </label>
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                sentiment === 'negative'
                  ? 'bg-error-500/20 border-error-500/40 shadow-md shadow-error-500/10'
                  : 'bg-neutral-900/50 border-neutral-800/50 hover:border-neutral-700/50'
              }`}
            >
              <input
                type="radio"
                name="sentiment"
                value="negative"
                checked={sentiment === 'negative'}
                onChange={(e) => setSentiment(e.target.value as 'positive' | 'negative')}
                className="hidden"
              />
              <ThumbsDown className={`w-5 h-5 ${sentiment === 'negative' ? 'text-error-400' : 'text-neutral-400'}`} />
              <span className={`font-medium ${sentiment === 'negative' ? 'text-neutral-50' : 'text-neutral-300'}`}>Negative</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-neutral-300 mb-2.5">
            Feedback
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus-ring focus:border-olive-500/50 transition-all duration-200 resize-none"
            placeholder="Share your thoughts, suggestions, or report issues..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="w-full px-4 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 disabled:from-neutral-700 disabled:to-neutral-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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

