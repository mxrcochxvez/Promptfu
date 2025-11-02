import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../../contexts/AuthContext'
import TestQuestion from '../../../../components/TestQuestion'
import {
  getTestWithQuestions,
  getTestSubmissions,
  submitTest,
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

export const Route = createFileRoute('/classes/$classId/tests/$testId')({
  component: TestView,
})

function TestView() {
  const { classId, testId } = Route.useParams()
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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading test...</div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Test not found</div>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/classes/$classId"
            params={{ classId }}
            className="text-cyan-400 hover:text-cyan-300 mb-4 inline-flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Class
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{test.title}</h1>
          {test.description && (
            <p className="text-gray-300 mb-4">{test.description}</p>
          )}
        </div>

        {/* Results Banner */}
        {showResults && score !== null && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              score >= passingScore
                ? 'bg-green-500/20 border-green-500'
                : 'bg-red-500/20 border-red-500'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {score >= passingScore ? (
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-400" />
              )}
              <h2 className="text-xl font-semibold text-white">
                {score >= passingScore ? 'Passed!' : 'Not Passed'}
              </h2>
            </div>
            <p className="text-gray-300">
              Your score: <span className="font-semibold">{score.toFixed(1)}%</span> (Passing
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
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
