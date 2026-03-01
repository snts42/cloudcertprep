import { AnswerButton } from './AnswerButton'
import { DOMAINS, DOMAIN_COLORS } from '../types'
import type { Question } from '../types'
import { Flag } from 'lucide-react'

interface QuestionReviewCardProps {
  question: Question
  userAnswer: string | string[]
  isCorrect: boolean
  wasFlagged?: boolean
  questionNumber: number
  totalQuestions: number
}

export function QuestionReviewCard({
  question,
  userAnswer,
  isCorrect,
  wasFlagged,
  questionNumber,
  totalQuestions,
}: QuestionReviewCardProps) {
  const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : userAnswer ? userAnswer.split(',') : []
  const correctAnswerArray = Array.isArray(question.answer) ? question.answer : [question.answer]

  return (
    <div className="bg-bg-card rounded-lg p-3 md:p-4 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-xs">
            Question {questionNumber} of {totalQuestions}
          </span>
          {wasFlagged && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-warning/20 text-warning rounded text-xs font-medium">
              <Flag className="w-3 h-3 fill-warning" /> Flagged
            </span>
          )}
        </div>
        <div className={`px-2 py-0.5 rounded-lg font-semibold text-xs ${
          isCorrect ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
        }`}>
          {isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
        </div>
      </div>

      {/* Domain Badge */}
      <div className="mb-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded" style={{
          backgroundColor: `${DOMAIN_COLORS[question.domainId as keyof typeof DOMAIN_COLORS]}20`,
          color: DOMAIN_COLORS[question.domainId as keyof typeof DOMAIN_COLORS]
        }}>
          {DOMAINS[question.domainId as keyof typeof DOMAINS]}
        </span>
      </div>

      {/* Question Text */}
      <h3 className="text-sm md:text-base text-text-primary mb-3">
        {question.question}
      </h3>

      {/* Answer Options */}
      <div className="space-y-1.5 mb-3">
        {Object.entries(question.options).map(([key, value]) => {
          const isUserAnswer = userAnswerArray.includes(key)
          const isCorrectAnswer = correctAnswerArray.includes(key)

          let state: 'default' | 'selected' | 'correct' | 'wrong' = 'default'
          if (isCorrectAnswer) state = 'correct'
          else if (isUserAnswer) state = 'wrong'

          return (
            <AnswerButton
              key={key}
              label={key as any}
              text={value}
              state={state}
              disabled={true}
              compact={true}
            />
          )
        })}
      </div>

      {/* Explanation */}
      {question.explanation && (
        <div className="bg-bg-dark rounded-lg p-3 border-l-4 border-aws-orange">
          {question.source === 'ai-generated' && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 mb-2">
              <span>✦</span> AI Generated
            </span>
          )}
          <h4 className="text-xs font-semibold text-text-primary mb-1">Explanation:</h4>
          <p className="text-xs md:text-sm text-text-muted">{question.explanation}</p>
        </div>
      )}

      {/* Question ID + Disclaimer */}
      <div className="mt-3 pt-2 border-t border-text-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
        <span className="text-xs text-text-muted/70 font-mono">{question.id}</span>
        <span className="text-[10px] text-text-muted/60">
          Found an error?{' '}
          <a 
            href="https://github.com/snts42/cloudcertprep/issues" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-aws-orange hover:text-aws-orange/80 hover:underline"
          >
            Report on GitHub
          </a>
        </span>
      </div>
    </div>
  )
}
