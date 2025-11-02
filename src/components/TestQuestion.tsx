import { useState } from 'react'

interface TestQuestionProps {
  questionId: number
  questionType: 'multiple_choice' | 'true_false' | 'short_answer'
  questionText: string
  options?: string[] | null
  correctAnswer?: string
  points: number
  userAnswer?: string
  showCorrect?: boolean
  onChange?: (answer: string) => void
  disabled?: boolean
}

export default function TestQuestion({
  questionId,
  questionType,
  questionText,
  options,
  correctAnswer,
  points,
  userAnswer = '',
  showCorrect = false,
  onChange,
  disabled = false,
}: TestQuestionProps) {
  const handleChange = (value: string) => {
    if (!disabled && onChange) {
      onChange(value)
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-4">
      <div className="flex justify-between items-start mb-4">
        <p className="text-white text-lg font-medium">{questionText}</p>
        <span className="text-sm text-gray-400 ml-4">({points} point{points !== 1 ? 's' : ''})</span>
      </div>

      {questionType === 'multiple_choice' && options && (
        <div className="space-y-2">
          {options.map((option, index) => {
            const isSelected = userAnswer === option
            const isCorrect = showCorrect && option === correctAnswer
            const isWrong = showCorrect && isSelected && option !== correctAnswer

            return (
              <label
                key={index}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  isCorrect
                    ? 'bg-green-500/20 border-green-500'
                    : isWrong
                      ? 'bg-red-500/20 border-red-500'
                      : isSelected
                        ? 'bg-olive-500/20 border-olive-500'
                        : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                } ${disabled ? 'cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name={`question-${questionId}`}
                  value={option}
                  checked={isSelected}
                  onChange={() => handleChange(option)}
                  disabled={disabled}
                  className="mr-3"
                />
                <span className="text-gray-200">{option}</span>
                {showCorrect && isCorrect && (
                  <span className="ml-auto text-green-400 text-sm">✓ Correct</span>
                )}
                {showCorrect && isWrong && (
                  <span className="ml-auto text-red-400 text-sm">✗ Incorrect</span>
                )}
              </label>
            )
          })}
        </div>
      )}

      {questionType === 'true_false' && (
        <div className="space-y-2">
          {['True', 'False'].map((option) => {
            const isSelected = userAnswer.toLowerCase() === option.toLowerCase()
            const isCorrect = showCorrect && option === correctAnswer
            const isWrong = showCorrect && isSelected && option !== correctAnswer

            return (
              <label
                key={option}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  isCorrect
                    ? 'bg-green-500/20 border-green-500'
                    : isWrong
                      ? 'bg-red-500/20 border-red-500'
                      : isSelected
                        ? 'bg-olive-500/20 border-olive-500'
                        : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                } ${disabled ? 'cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name={`question-${questionId}`}
                  value={option}
                  checked={isSelected}
                  onChange={() => handleChange(option)}
                  disabled={disabled}
                  className="mr-3"
                />
                <span className="text-gray-200">{option}</span>
                {showCorrect && isCorrect && (
                  <span className="ml-auto text-green-400 text-sm">✓ Correct</span>
                )}
                {showCorrect && isWrong && (
                  <span className="ml-auto text-red-400 text-sm">✗ Incorrect</span>
                )}
              </label>
            )
          })}
        </div>
      )}

      {questionType === 'short_answer' && (
        <div>
          <textarea
            value={userAnswer}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-olive-500 disabled:opacity-50"
            rows={4}
            placeholder="Type your answer here..."
          />
          {showCorrect && (
            <div className="mt-3 p-3 bg-slate-700/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Correct Answer:</p>
              <p className="text-white">{correctAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
