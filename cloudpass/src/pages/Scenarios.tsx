import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnswerButton } from '../components/AnswerButton'
import { ProgressBar } from '../components/ProgressBar'
import type { Question } from '../types'
import masterQuestions from '../data/master_questions.json'
import { isAnswerCorrect } from '../lib/scoring'

type Screen = 'start' | 'practice' | 'results'

const SCENARIO_KEYWORDS = [
  'a company',
  'an organisation',
  'an organization',
  'which service',
  'which aws service',
  'most cost-effective',
  'a solutions architect',
  'recommended solution',
  'best option',
  'best practice',
  'a developer',
  'an application',
  'a business',
]

export function Scenarios() {
  const navigate = useNavigate()
  const [screen, setScreen] = useState<Screen>('start')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState<string | string[] | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [results, setResults] = useState<boolean[]>([])

  function startPractice() {
    const scenarioQuestions = (masterQuestions as Question[])
      .filter(q => {
        const lowerQuestion = q.question.toLowerCase()
        return SCENARIO_KEYWORDS.some(keyword => lowerQuestion.includes(keyword))
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 30)
    
    setQuestions(scenarioQuestions)
    setCurrentIndex(0)
    setUserAnswer(null)
    setShowFeedback(false)
    setResults([])
    setScreen('practice')
  }

  function handleAnswer(answer: string) {
    const current = questions[currentIndex]
    
    if (current.isMultiAnswer) {
      const currentAnswers = Array.isArray(userAnswer) ? userAnswer : []
      let newAnswers: string[]
      
      if (currentAnswers.includes(answer)) {
        newAnswers = currentAnswers.filter(a => a !== answer)
      } else {
        newAnswers = [...currentAnswers, answer]
      }
      
      setUserAnswer(newAnswers)
    } else {
      setUserAnswer(answer)
      setTimeout(() => checkAnswer(answer), 300)
    }
  }

  function checkAnswer(answer?: string | string[]) {
    const current = questions[currentIndex]
    const answerToCheck = answer || userAnswer
    const correct = isAnswerCorrect(answerToCheck!, current.answer, current.isMultiAnswer)
    
    setResults([...results, correct])
    setShowFeedback(true)
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setUserAnswer(null)
      setShowFeedback(false)
    } else {
      setScreen('results')
    }
  }

  const currentQuestion = questions[currentIndex]
  const correctCount = results.filter(r => r).length
  const isCorrect = showFeedback && currentQuestion && isAnswerCorrect(userAnswer!, currentQuestion.answer, currentQuestion.isMultiAnswer)

  if (screen === 'start') {
    const totalScenarios = (masterQuestions as Question[]).filter(q => {
      const lowerQuestion = q.question.toLowerCase()
      return SCENARIO_KEYWORDS.some(keyword => lowerQuestion.includes(keyword))
    }).length

    return (
      <div className="min-h-screen bg-bg-dark p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-bg-card rounded-lg p-8">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Scenario Practice</h1>
            <p className="text-text-muted mb-8">
              Practice with real-world scenario questions that test your ability to apply AWS knowledge to business situations.
            </p>

            <div className="bg-bg-dark rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-text-primary mb-4">What to Expect</h2>
              <ul className="space-y-2 text-text-muted">
                <li>• 30 random scenario-based questions</li>
                <li>• Immediate feedback after each answer</li>
                <li>• Focus on practical AWS applications</li>
                <li>• {totalScenarios} total scenarios available</li>
              </ul>
            </div>

            <button
              onClick={startPractice}
              className="w-full bg-aws-orange hover:bg-aws-orange/90 text-white font-bold py-4 rounded-lg transition-colors text-lg mb-4"
            >
              Start Practice
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full bg-bg-dark hover:bg-bg-card-hover text-text-primary font-medium py-3 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'results') {
    const percentScore = (correctCount / results.length) * 100
    
    return (
      <div className="min-h-screen bg-bg-dark p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-bg-card rounded-lg p-8 text-center">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Session Complete!</h1>
            
            <div className="my-8">
              <div className="text-6xl font-bold text-aws-orange mb-2">
                {Math.round(percentScore)}%
              </div>
              <p className="text-text-muted">Score</p>
            </div>

            <div className="bg-bg-dark rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-text-muted text-sm mb-1">Correct</p>
                  <p className="text-3xl font-bold text-success">{correctCount}</p>
                </div>
                <div>
                  <p className="text-text-muted text-sm mb-1">Total</p>
                  <p className="text-3xl font-bold text-text-primary">{results.length}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 bg-bg-dark hover:bg-bg-card-hover text-text-primary font-semibold rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={startPractice}
                className="flex-1 px-6 py-3 bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold rounded-lg transition-colors"
              >
                Practice Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'practice' && currentQuestion) {
    return (
      <div className="min-h-screen bg-bg-dark p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-bg-card hover:bg-bg-card-hover text-text-primary font-medium rounded-lg transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-xl font-semibold text-text-primary">
              Scenario Practice
            </h2>
            <div className="w-20"></div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-muted text-sm">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <ProgressBar percent={(currentIndex / questions.length) * 100} showLabel={false} />
          </div>

          {/* Question */}
          <div className="bg-bg-card rounded-lg p-6 mb-6">
            <h3 className="text-xl text-text-primary mb-6">{currentQuestion.question}</h3>

            <div className="space-y-3 mb-6">
              {Object.entries(currentQuestion.options).map(([key, value]) => {
                const isSelected = currentQuestion.isMultiAnswer
                  ? Array.isArray(userAnswer) && userAnswer.includes(key)
                  : userAnswer === key
                
                let state: 'default' | 'selected' | 'correct' | 'wrong' = 'default'
                
                if (showFeedback) {
                  const correctAnswers = Array.isArray(currentQuestion.answer) ? currentQuestion.answer : [currentQuestion.answer]
                  const isCorrectAnswer = correctAnswers.includes(key)
                  
                  if (isCorrectAnswer) {
                    state = 'correct'
                  } else if (isSelected) {
                    state = 'wrong'
                  }
                } else if (isSelected) {
                  state = 'selected'
                }
                
                return (
                  <AnswerButton
                    key={key}
                    label={key as any}
                    text={value}
                    state={state}
                    onClick={() => !showFeedback && handleAnswer(key)}
                    disabled={showFeedback}
                  />
                )
              })}
            </div>

            {currentQuestion.isMultiAnswer && !showFeedback && (
              <button
                onClick={() => checkAnswer()}
                disabled={!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)}
                className="w-full px-6 py-3 bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            )}

            {showFeedback && (
              <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-success/10 border border-success' : 'bg-danger/10 border border-danger'}`}>
                <p className={`font-semibold mb-2 ${isCorrect ? 'text-success' : 'text-danger'}`}>
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                {currentQuestion.explanation && (
                  <p className="text-text-muted text-sm">{currentQuestion.explanation}</p>
                )}
              </div>
            )}
          </div>

          {showFeedback && (
            <button
              onClick={nextQuestion}
              className="w-full px-6 py-3 bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold rounded-lg transition-colors"
            >
              {currentIndex < questions.length - 1 ? 'Next Question →' : 'Finish Session'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
