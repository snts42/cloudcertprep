import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AnswerButton } from '../components/AnswerButton'
import { ProgressBar } from '../components/ProgressBar'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import type { Question } from '../types'
import masterQuestions from '../data/master_questions.json'
import { isAnswerCorrect } from '../lib/scoring'

type Screen = 'loading' | 'empty' | 'practice' | 'results'

export function WeakSpot() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [screen, setScreen] = useState<Screen>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState<string | string[] | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [results, setResults] = useState<boolean[]>([])

  useEffect(() => {
    loadWeakSpots()
  }, [user])

  async function loadWeakSpots() {
    try {
      const { data: weakSpots, error } = await supabase
        .from('weak_spots')
        .select('question_id, incorrect_count')
        .eq('user_id', user?.id)
        .eq('is_cleared', false)
        .gte('incorrect_count', 2)
        .order('incorrect_count', { ascending: false })
        .limit(20)

      if (error) throw error

      if (!weakSpots || weakSpots.length === 0) {
        setScreen('empty')
        return
      }

      const questionIds = weakSpots.map(ws => ws.question_id)
      const weakQuestions = (masterQuestions as Question[]).filter(q => 
        questionIds.includes(q.id)
      )

      setQuestions(weakQuestions)
      setScreen('practice')
    } catch (error) {
      console.error('Error loading weak spots:', error)
      setScreen('empty')
    }
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

  async function checkAnswer(answer?: string | string[]) {
    const current = questions[currentIndex]
    const answerToCheck = answer || userAnswer
    const correct = isAnswerCorrect(answerToCheck!, current.answer, current.isMultiAnswer)
    
    setResults([...results, correct])
    setShowFeedback(true)

    try {
      if (correct) {
        const { data: currentSpot } = await supabase
          .from('weak_spots')
          .select('correct_streak')
          .eq('user_id', user?.id)
          .eq('question_id', current.id)
          .single()

        const newStreak = (currentSpot?.correct_streak || 0) + 1

        await supabase
          .from('weak_spots')
          .update({
            correct_streak: newStreak,
            is_cleared: newStreak >= 3,
          })
          .eq('user_id', user?.id)
          .eq('question_id', current.id)
      } else {
        await supabase
          .from('weak_spots')
          .update({
            incorrect_count: supabase.rpc('increment', { x: 1 }),
            correct_streak: 0,
          })
          .eq('user_id', user?.id)
          .eq('question_id', current.id)
      }
    } catch (error) {
      console.error('Error updating weak spot:', error)
    }
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setUserAnswer(null)
      setShowFeedback(false)
    } else {
      finishPractice()
    }
  }

  function finishPractice() {
    setScreen('results')
  }

  const currentQuestion = questions[currentIndex]
  const correctCount = results.filter(r => r).length
  const isCorrect = showFeedback && currentQuestion && isAnswerCorrect(userAnswer!, currentQuestion.answer, currentQuestion.isMultiAnswer)

  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <LoadingSpinner text="Loading weak spots..." />
      </div>
    )
  }

  if (screen === 'empty') {
    return (
      <div className="min-h-screen bg-bg-dark p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-bg-card rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-text-primary mb-4">No Weak Spots!</h1>
            <p className="text-text-muted mb-8">
              You haven't missed enough questions to create weak spots yet. Complete some practice sessions or mock exams first.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/domain-practice')}
                className="px-6 py-3 bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold rounded-lg transition-colors"
              >
                Domain Practice
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-bg-dark hover:bg-bg-card-hover text-text-primary font-semibold rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'results') {
    const clearedCount = results.filter(r => r).length
    
    return (
      <div className="min-h-screen bg-bg-dark p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-bg-card rounded-lg p-8 text-center">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Training Complete!</h1>
            
            <div className="my-8">
              <div className="text-6xl font-bold text-success mb-2">
                {clearedCount}
              </div>
              <p className="text-text-muted">Weak spots improved</p>
            </div>

            <div className="bg-bg-dark rounded-lg p-6 mb-6">
              <p className="text-text-muted text-sm mb-2">Session Results</p>
              <p className="text-3xl font-bold text-text-primary">
                {correctCount}/{results.length}
              </p>
              <p className="text-text-muted text-sm mt-2">Correct answers</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setScreen('loading')
                  setCurrentIndex(0)
                  setResults([])
                  setUserAnswer(null)
                  setShowFeedback(false)
                  loadWeakSpots()
                }}
                className="flex-1 px-6 py-3 bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold rounded-lg transition-colors"
              >
                Train Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 bg-bg-dark hover:bg-bg-card-hover text-text-primary font-semibold rounded-lg transition-colors"
              >
                Back to Dashboard
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
              Weak Spot Trainer
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
              {currentIndex < questions.length - 1 ? 'Next Question →' : 'Finish Training'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
