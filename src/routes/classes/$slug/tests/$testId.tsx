import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../../contexts/AuthContext'
import TestQuestion from '../../../../components/TestQuestion'
import {
  getTestWithQuestions,
  getTestSubmissions,
  submitTest,
  getTestById,
} from '../../../../db/queries'
import { useState } from 'react'
import { ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react'

const getTest = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { testId: number }) => data)
  .handler(async ({ data }) => {
    return await getTestWithQuestions(data.testId)
  })

const getUserSubmissions = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number; testId: number }) => data)
  .handler(async ({ data }) => {
    return await getTestSubmissions(data.userId, data.testId)
  })

const submitTestFn = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (data: {
      userId: number
      testId: number
      answers: { questionId: number; answerText: string }[]
    }) => data
  )
  .handler(async ({ data }) => {
    return await submitTest(data.userId, data.testId, data.answers)
  })

export const Route = createFileRoute('/classes/$slug/tests/$testId')({
  component: TestView,
})

function TestView() {
  const { slug, testId } = Route.useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const testIdNum = parseInt(testId)

  const { data: test, isLoading: testLoading } = useQuery({
    queryKey: ['test', testId],
    queryFn: async () => {
      return await getTest({ data: { testId: testIdNum } as any })
    },
  })

  const { data: submissions } = useQuery({
    queryKey: ['testSubmissions', testId, user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      return await getUserSubmissions({
        data: { userId: user.id, testId: testIdNum },
      })
    },
    enabled: !!user?.id,
  })

  const latestSubmission = submissions && submissions.length > 0 ? submissions[0] : null
  const hasSubmitted = !!latestSubmission

  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submittedAnswers, setSubmittedAnswers] =
    useState<Record<number, string> | null>(null)

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      if (!test) throw new Error('Test not loaded')

      const answerArray = test.questions.map((q) => ({
        questionId: q.id,
        answerText: answers[q.id] || '',
      }))

      return await submitTestFn({
        data: { userId: user.id, testId: testIdNum, answers: answerArray },
      })
    },
    onSuccess: (result) => {
      setSubmittedAnswers(answers)
      queryClient.invalidateQueries({ queryKey: ['testSubmissions'] })
      queryClient.invalidateQueries({ queryKey: ['classProgress'] })
      queryClient.invalidateQueries({ queryKey: ['enrolledClasses'] })
    },
  })

  if (testLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-olive-500/30 border-t-olive-500 mx-auto mb-4"></div>
          <div className="text-neutral-300">Loading test...</div>
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center glass-effect rounded-2xl p-8 card-shadow">
          <div className="text-neutral-50 text-xl font-semibold">Test not found</div>
        </div>
      </div>
    )
  }

  const handleAnswerChange = (questionId: number, answer: string) => {
    if (hasSubmitted) return
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = async () => {
    if (!user) return

    // Check if all questions are answered
    const allAnswered = test.questions.every((q) => answers[q.id])
    if (!allAnswered) {
      alert('Please answer all questions before submitting.')
      return
    }

    await submitMutation.mutateAsync()
  }

  const displayAnswers = submittedAnswers || answers
  const showResults = hasSubmitted && latestSubmission
  const score = latestSubmission?.score
    ? parseFloat(latestSubmission.score.toString())
    : null
  const passingScore = test.passingScore
    ? parseFloat(test.passingScore.toString())
    : 70

  return (
    <div className="min-h-screen bg-gradient-hero py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/classes/$slug"
            params={{ slug }}
            className="text-accent-500 hover:text-accent-400 mb-4 inline-flex items-center gap-2 transition-colors duration-200 font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Class
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-50 mb-4">{test.title}</h1>
          {test.description && (
            <p className="text-neutral-300 mb-4 leading-relaxed">{test.description}</p>
          )}
        </div>

        {/* Results Banner */}
        {showResults && score !== null && (
          <div
            className={`mb-6 p-6 rounded-2xl border card-shadow ${
              score >= passingScore
                ? 'bg-success-500/10 border-success-500/30'
                : 'bg-error-500/10 border-error-500/30'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {score >= passingScore ? (
                <CheckCircle2 className="w-6 h-6 text-success-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-error-400" />
              )}
              <h2 className="text-xl font-bold text-neutral-50">
                {score >= passingScore ? 'Passed!' : 'Not Passed'}
              </h2>
            </div>
            <p className="text-neutral-300">
              Your score: <span className="font-bold">{score.toFixed(1)}%</span> (Passing
              score: {passingScore}%)
            </p>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {test.questions.map((question) => {
            const options = question.options
              ? (Array.isArray(question.options)
                  ? question.options
                  : JSON.parse(question.options as string))
              : null

            return (
              <TestQuestion
                key={question.id}
                questionId={question.id}
                questionType={
                  question.questionType as
                    | 'multiple_choice'
                    | 'true_false'
                    | 'short_answer'
                }
                questionText={question.questionText}
                options={options}
                correctAnswer={question.correctAnswer}
                points={question.points}
                userAnswer={displayAnswers[question.id] || ''}
                showCorrect={showResults}
                onChange={(answer) => handleAnswerChange(question.id, answer)}
                disabled={hasSubmitted}
              />
            )
          })}
        </div>

        {/* Submit Button */}
        {!hasSubmitted && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={
                submitMutation.isPending ||
                test.questions.some((q) => !answers[q.id])
              }
              className="px-8 py-3.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-olive-500/20 hover:shadow-xl hover:shadow-olive-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

