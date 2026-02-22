import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Header } from '../components/Header'
import { AnswerButton } from '../components/AnswerButton'
import { ProgressBar } from '../components/ProgressBar'
import { supabase } from '../lib/supabase'
import { DOMAINS, DOMAIN_COLORS } from '../types'
import type { Question } from '../types'
import masterQuestions from '../data/master_questions.json'
import { isAnswerCorrect } from '../lib/scoring'
import { calculateDomainMastery } from '../lib/domainStats'

type Screen = 'selection' | 'config' | 'practice' | 'results'

interface QuestionHistory {
  questionId: string
  correctCount: number
  incorrectCount: number
  lastSeen: number
}

export function DomainPractice() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [screen, setScreen] = useState<Screen>('selection')
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null)
  const [questionCount, setQuestionCount] = useState(20)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState<string | string[] | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [questionHistory, setQuestionHistory] = useState<Map<string, QuestionHistory>>(new Map())

  function selectDomain(domainId: number) {
    setSelectedDomain(domainId)
    setScreen('config')
  }

  async function startPractice() {
    // Load question history from localStorage
    const historyKey = `domain_${selectedDomain}_history`
    const savedHistory = localStorage.getItem(historyKey)
    const history: Map<string, QuestionHistory> = savedHistory 
      ? new Map(JSON.parse(savedHistory))
      : new Map()
    
    setQuestionHistory(history)

    // Get all questions for this domain
    const allDomainQuestions = (masterQuestions as Question[])
      .filter(q => q.domainId === selectedDomain)

    // Sort questions by priority (wrong answers first, then least seen)
    const sortedQuestions = allDomainQuestions.sort((a, b) => {
      const histA = history.get(a.id)
      const histB = history.get(b.id)
      
      // Prioritize questions with more incorrect answers
      const scoreA = (histA?.incorrectCount || 0) - (histA?.correctCount || 0)
      const scoreB = (histB?.incorrectCount || 0) - (histB?.correctCount || 0)
      
      if (scoreA !== scoreB) return scoreB - scoreA
      
      // Then by least recently seen
      return (histA?.lastSeen || 0) - (histB?.lastSeen || 0)
    })

    // Take the requested number of questions
    const selectedQuestions = sortedQuestions.slice(0, questionCount)
    
    setQuestions(selectedQuestions)
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

    // Update question history
    const newHistory = new Map(questionHistory)
    const existing = newHistory.get(current.id) || { questionId: current.id, correctCount: 0, incorrectCount: 0, lastSeen: 0 }
    
    if (correct) {
      existing.correctCount++
    } else {
      existing.incorrectCount++
    }
    existing.lastSeen = Date.now()
    
    newHistory.set(current.id, existing)
    setQuestionHistory(newHistory)

    // Save to localStorage
    const historyKey = `domain_${selectedDomain}_history`
    localStorage.setItem(historyKey, JSON.stringify(Array.from(newHistory.entries())))
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

  async function finishPractice() {
    const correctCount = results.filter(r => r).length

    // Only save to database if user is logged in
    if (user) {
      try {
        // Get existing progress
        const { data: existingProgress } = await supabase
          .from('domain_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('domain_id', selectedDomain)
          .single()

        const newAttempted = (existingProgress?.questions_attempted || 0) + results.length
        const newCorrect = (existingProgress?.questions_correct || 0) + correctCount
        const newMastery = calculateDomainMastery(newCorrect, selectedDomain as 1 | 2 | 3 | 4)

        await supabase.from('domain_progress').upsert({
          user_id: user.id,
          domain_id: selectedDomain,
          questions_attempted: newAttempted,
          questions_correct: newCorrect,
          mastery_percent: newMastery,
        }, {
          onConflict: 'user_id,domain_id',
        })
      } catch (error) {
        console.error('Error saving domain progress:', error)
      }
    }

    setScreen('results')
  }

  const currentQuestion = questions[currentIndex]
  const correctCount = results.filter(r => r).length
  const isCorrect = showFeedback && currentQuestion && isAnswerCorrect(userAnswer!, currentQuestion.answer, currentQuestion.isMultiAnswer)

  if (screen === 'selection') {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col">
        <Header showNav={true} />
        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Domain Practice</h1>
          <p className="text-text-muted mb-8">Choose a domain to practice</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(domainId => {
              const totalQuestions = (masterQuestions as Question[]).filter(q => q.domainId === domainId).length
              
              return (
                <button
                  key={domainId}
                  onClick={() => selectDomain(domainId)}
                  className="bg-bg-card hover:bg-bg-card-hover p-6 rounded-lg border-2 border-transparent hover:border-aws-orange transition-all text-left"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
                      style={{ backgroundColor: DOMAIN_COLORS[domainId as keyof typeof DOMAIN_COLORS] + '20', color: DOMAIN_COLORS[domainId as keyof typeof DOMAIN_COLORS] }}
                    >
                      {domainId}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary">
                        {DOMAINS[domainId as keyof typeof DOMAINS]}
                      </h3>
                      <p className="text-sm text-text-muted">{totalQuestions} questions</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => navigate('/')}
            className="mt-8 px-6 py-3 bg-bg-card hover:bg-bg-card-hover text-text-primary font-medium rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'config') {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col">
        <Header showNav={true} />
        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
          <div className="bg-bg-card rounded-lg p-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {DOMAINS[selectedDomain as keyof typeof DOMAINS]}
            </h1>
            <p className="text-text-muted mb-8">Configure your practice session</p>

            <div className="mb-8">
              <label className="block text-text-primary font-medium mb-4">
                Number of Questions: {questionCount}
              </label>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-2 bg-bg-dark rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #FF9900 0%, #FF9900 ${((questionCount - 10) / 40) * 100}%, #1A2332 ${((questionCount - 10) / 40) * 100}%, #1A2332 100%)`
                }}
              />
              <div className="flex justify-between text-sm text-text-muted mt-2">
                <span>10</span>
                <span>50</span>
              </div>
            </div>

            <div className="bg-bg-dark rounded-lg p-4 mb-8">
              <p className="text-sm text-text-muted">
                <span className="text-aws-orange font-semibold">Smart Practice:</span> Questions you've gotten wrong will appear more frequently. Questions you consistently get right will appear less often.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setScreen('selection')}
                className="flex-1 px-6 py-3 bg-bg-dark hover:bg-bg-card-hover text-text-primary font-medium rounded-lg transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={startPractice}
                className="flex-1 px-6 py-3 bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold rounded-lg transition-colors"
              >
                Start Practice
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'results') {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col">
        <Header showNav={true} />
        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
          <div className="bg-bg-card rounded-lg p-8 text-center">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Session Complete!</h1>
            
            <div className="my-8">
              <div className="text-6xl font-bold" style={{ color: DOMAIN_COLORS[selectedDomain as keyof typeof DOMAIN_COLORS] }}>
                {Math.round((correctCount / results.length) * 100)}%
              </div>
              <p className="text-text-muted mt-2">Mastery</p>
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
                onClick={() => setScreen('selection')}
                className="flex-1 px-6 py-3 bg-bg-dark hover:bg-bg-card-hover text-text-primary font-semibold rounded-lg transition-colors"
              >
                Choose Another Domain
              </button>
              <button
                onClick={() => selectDomain(selectedDomain!)}
                className="flex-1 px-6 py-3 bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold rounded-lg transition-colors"
              >
                Retry Domain
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'practice' && currentQuestion) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col">
        <Header showNav={true} />
        <div className="flex-1 p-4 md:p-8">
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
              {DOMAINS[selectedDomain as keyof typeof DOMAINS]}
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
                <p className={`font-semibold mb-3 ${isCorrect ? 'text-success' : 'text-danger'}`}>
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                
                {!isCorrect && (
                  <div className="mb-3 text-sm">
                    <p className="text-danger font-medium mb-1">
                      Your answer: {currentQuestion.isMultiAnswer 
                        ? (Array.isArray(userAnswer) ? userAnswer.join(', ') : '')
                        : userAnswer}
                    </p>
                    <p className="text-success font-medium">
                      Correct answer: {Array.isArray(currentQuestion.answer) 
                        ? currentQuestion.answer.join(', ') 
                        : currentQuestion.answer}
                    </p>
                  </div>
                )}
                
                {currentQuestion.explanation && (
                  <div className="border-t border-text-muted/20 pt-3 mt-3">
                    <p className="text-text-muted text-sm font-medium mb-1">Explanation:</p>
                    <p className="text-text-muted text-sm">{currentQuestion.explanation}</p>
                  </div>
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
      </div>
    )
  }

  return null
}
