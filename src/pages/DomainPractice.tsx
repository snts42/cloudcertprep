import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Header } from '../components/Header'
import { AnswerButton } from '../components/AnswerButton'
import { ProgressBar } from '../components/ProgressBar'
import { supabase } from '../lib/supabase'
import { updateDomainProgress } from '../lib/supabaseUtils'
import { DOMAINS, DOMAIN_COLORS } from '../types'
import type { Question } from '../types'
import { loadDomainQuestions } from '../data/questions'
import { isAnswerCorrect } from '../lib/scoring'
import { DOMAIN_QUESTION_COUNTS } from '../lib/domainStats'
import { useSpacedRepetition } from '../hooks/useSpacedRepetition'
import { Check, X } from 'lucide-react'

type Screen = 'selection' | 'config' | 'practice' | 'results'

interface QuestionResult {
  question: Question
  userAnswer: string | string[]
  isCorrect: boolean
}

export function DomainPractice() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [screen, setScreen] = useState<Screen>('selection')
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null)
  const [questionCount, setQuestionCount] = useState(20)

  // Set dynamic page title based on screen and domain
  useEffect(() => {
    if (screen === 'selection' || screen === 'config') {
      document.title = "Domain Practice | CloudCertPrep"
    } else if (screen === 'practice' && selectedDomain !== null) {
      const domainName = DOMAINS[selectedDomain as keyof typeof DOMAINS]
      document.title = `${domainName} Practice | CloudCertPrep`
    } else if (screen === 'results') {
      document.title = "Practice Results | CloudCertPrep"
    }
    return () => {
      document.title = "CloudCertPrep | Free AWS CLF-C02 Practice Exams"
    }
  }, [screen, selectedDomain])
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState<string | string[] | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([])
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0)
  const { selectQuestions } = useSpacedRepetition(user?.id ?? null, selectedDomain)

  function selectDomain(domainId: number) {
    setSelectedDomain(domainId)
    setScreen('config')
  }

  async function startPractice() {
    // Load only the selected domain's questions (separate chunk)
    const allDomainQuestions = await loadDomainQuestions(selectedDomain!)

    // Use spaced repetition for authenticated users, random shuffle for guests
    const selectedQuestions = selectQuestions(allDomainQuestions, questionCount)
    
    setQuestions(selectedQuestions)
    setCurrentIndex(0)
    setUserAnswer(null)
    setShowFeedback(false)
    setResults([])
    setQuestionResults([])
    setScreen('practice')
  }

  function handleAnswer(answer: string) {
    const current = questions[currentIndex]
    
    if (current.isMultiAnswer) {
      const currentAnswers = Array.isArray(userAnswer) ? userAnswer : []
      let newAnswers: string[]
      
      if (currentAnswers.includes(answer)) {
        // Allow deselection
        newAnswers = currentAnswers.filter(a => a !== answer)
      } else {
        // Enforce max 2 selections
        if (currentAnswers.length >= 2) {
          return // Don't allow more than 2 selections
        }
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
    setQuestionResults([...questionResults, {
      question: current,
      userAnswer: answerToCheck!,
      isCorrect: correct
    }])
    setShowFeedback(true)
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
    // Only save to database if user is logged in
    if (user) {
      try {
        // Save each question result to attempt_questions table (without attempt_id for practice mode)
        const questionRecords = questions.map((q, idx) => ({
          attempt_id: null, // Practice mode doesn't have an exam attempt
          user_id: user.id,
          question_id: q.id,
          user_answer: Array.isArray(questionResults[idx]?.userAnswer) 
            ? questionResults[idx].userAnswer.join(',') 
            : questionResults[idx]?.userAnswer || '',
          correct_answer: Array.isArray(q.answer) ? q.answer.join(',') : q.answer,
          is_correct: results[idx] || false,
          was_flagged: false,
          domain_id: selectedDomain,
        }))

        // Insert practice question results
        const { error: questionsError } = await supabase
          .from('attempt_questions')
          .insert(questionRecords)

        if (questionsError) throw questionsError

        await updateDomainProgress(user.id, selectedDomain!)
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
      <div className="bg-bg-dark flex flex-col">
        <Header showNav={true} />
        <div className="p-4 md:p-8">
          <div className="max-w-2xl mx-auto bg-bg-card rounded-lg p-4 md:p-6 lg:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-3 md:mb-4">Domain Practice</h1>
          <p className="text-sm md:text-base text-text-muted mb-6 md:mb-8">Practice questions from a specific domain</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            {[1, 2, 3, 4].map(domainId => {
              const totalQuestions = DOMAIN_QUESTION_COUNTS[domainId as keyof typeof DOMAIN_QUESTION_COUNTS]
              
              return (
                <button
                  key={domainId}
                  onClick={() => selectDomain(domainId)}
                  className="bg-bg-dark hover:bg-bg-card-hover p-4 md:p-6 rounded-lg border-2 border-transparent hover:border-aws-orange transition-all text-left"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div 
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold flex-shrink-0"
                      style={{ backgroundColor: DOMAIN_COLORS[domainId as keyof typeof DOMAIN_COLORS] + '20', color: DOMAIN_COLORS[domainId as keyof typeof DOMAIN_COLORS] }}
                    >
                      {domainId}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm md:text-base lg:text-lg font-semibold text-text-primary">
                        {DOMAINS[domainId as keyof typeof DOMAINS]}
                      </h3>
                      <p className="text-xs md:text-sm text-text-muted">{totalQuestions} questions</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-bg-dark hover:bg-bg-card-hover text-text-primary font-medium py-2.5 md:py-3 rounded-lg transition-colors text-sm md:text-base"
          >
            ← Back to Home
          </button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'config') {
    return (
      <div className="bg-bg-dark flex flex-col">
        <Header showNav={true} />
        <div className="p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
          <div className="bg-bg-card rounded-lg p-4 md:p-6 lg:p-8">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-text-primary mb-2">
              {DOMAINS[selectedDomain as keyof typeof DOMAINS]}
            </h1>
            <p className="text-sm md:text-base text-text-muted mb-6 md:mb-8">Configure your practice session</p>

            <div className="flex items-center justify-between mb-8">
              <label className="text-text-primary font-medium">
                Number of Questions:
              </label>
              <div className="flex items-center gap-3 md:gap-4">
                <button
                  onClick={() => setQuestionCount(Math.max(10, questionCount - 5))}
                  disabled={questionCount <= 10}
                  className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-bg-dark hover:bg-bg-card-hover text-text-primary text-xl md:text-2xl font-bold rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <span className="text-2xl md:text-3xl font-bold text-text-primary w-12 md:w-16 text-center">
                  {questionCount}
                </span>
                <button
                  onClick={() => setQuestionCount(Math.min(50, questionCount + 5))}
                  disabled={questionCount >= 50}
                  className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-bg-dark hover:bg-bg-card-hover text-text-primary text-xl md:text-2xl font-bold rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
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
    const currentResult = questionResults[selectedQuestionIndex]
    
    return (
      <div className="bg-bg-dark flex flex-col">
        <Header showNav={true} />
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Summary Header */}
            <div className="bg-bg-card rounded-lg p-4 md:p-5 text-center mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">Practice session complete!</h1>
              <p className="text-lg md:text-xl text-text-muted">
                You got <span className="text-success font-bold">{correctCount}/{results.length}</span> correct ({Math.round((correctCount / results.length) * 100)}%)
              </p>
            </div>

            {/* Question Number Grid */}
            <div className="bg-bg-card rounded-lg p-3 md:p-4 mb-4">
              <h3 className="text-xs md:text-sm font-semibold text-text-muted mb-2 text-center">Questions:</h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(32px,32px))] md:grid-cols-[repeat(auto-fit,minmax(40px,40px))] gap-1.5 md:gap-2 justify-center">
                {questionResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedQuestionIndex(idx)}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-md font-semibold text-xs md:text-sm transition-all flex items-center justify-center ${
                      selectedQuestionIndex === idx
                        ? 'ring-2 ring-aws-orange'
                        : ''
                    } ${
                      result.isCorrect
                        ? 'bg-success/20 text-success hover:bg-success/30'
                        : 'bg-danger/20 text-danger hover:bg-danger/30'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Single Question View */}
            <div className="bg-bg-card rounded-lg p-3 md:p-4 lg:p-5 mb-4">
              {currentResult && (() => {
                const userAnswerArray = Array.isArray(currentResult.userAnswer) ? currentResult.userAnswer : [currentResult.userAnswer]
                const correctAnswerArray = Array.isArray(currentResult.question.answer) ? currentResult.question.answer : [currentResult.question.answer]
                
                return (
                  <div>
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-sm md:text-base font-semibold text-text-primary flex items-center justify-between">
                        Question {selectedQuestionIndex + 1} of {questionResults.length}
                      </h3>
                      <div className={`${currentResult.isCorrect ? 'text-success' : 'text-danger'}`}>
                        {currentResult.isCorrect ? <Check className="w-5 h-5 md:w-6 md:h-6" /> : <X className="w-5 h-5 md:w-6 md:h-6" />}
                      </div>
                    </div>

                    {/* Question Text */}
                    <p className="text-sm md:text-base text-text-primary mb-3">{currentResult.question.question}</p>

                    {/* Answer Options */}
                    <div className="space-y-1.5 md:space-y-2 mb-3">
                      {Object.entries(currentResult.question.options).map(([key, value]) => {
                        const isUserAnswer = userAnswerArray.includes(key)
                        const isCorrectAnswer = correctAnswerArray.includes(key)
                        
                        let bgColor = ''
                        let textColor = 'text-text-primary'
                        let label = ''
                        
                        if (isUserAnswer && isCorrectAnswer) {
                          bgColor = 'bg-success/10 border-success'
                          textColor = 'text-success'
                          label = ' (Your answer - Correct!)'
                        } else if (isUserAnswer && !isCorrectAnswer) {
                          bgColor = 'bg-danger/10 border-danger'
                          textColor = 'text-danger'
                          label = ' (Your answer - Incorrect)'
                        } else if (!isUserAnswer && isCorrectAnswer) {
                          bgColor = 'bg-success/10 border-success'
                          textColor = 'text-success'
                          label = ' (Correct answer)'
                        } else {
                          bgColor = 'bg-bg-dark border-text-muted/20'
                        }
                        
                        return (
                          <div
                            key={key}
                            className={`p-2 md:p-2.5 rounded-lg border-2 ${bgColor} ${textColor} text-xs md:text-sm`}
                          >
                            <span className="font-semibold">{key}.</span> {value}{label}
                          </div>
                        )
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="bg-bg-dark rounded-lg p-2.5 md:p-3">
                      {currentResult.question.source === 'ai-generated' && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-2">
                          <span>✦</span> AI Generated
                        </span>
                      )}
                      <p className="text-sm text-text-muted mt-3 leading-relaxed">{currentResult.question.explanation}</p>
                    </div>

                    {/* Question ID */}
                    <div className="mt-3 pt-2 border-t border-text-muted/20">
                      <span className="text-xs text-text-muted/70 font-mono">{currentResult.question.id}</span>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setSelectedQuestionIndex(Math.max(0, selectedQuestionIndex - 1))}
                disabled={selectedQuestionIndex === 0}
                className="flex-1 px-6 py-3 bg-bg-card hover:bg-bg-card-hover text-text-primary font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={() => setSelectedQuestionIndex(Math.min(questionResults.length - 1, selectedQuestionIndex + 1))}
                disabled={selectedQuestionIndex === questionResults.length - 1}
                className="flex-1 px-6 py-3 bg-bg-card hover:bg-bg-card-hover text-text-primary font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 mt-6">
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 bg-bg-card hover:bg-bg-card-hover text-text-primary font-semibold rounded-lg transition-colors"
              >
                Back to Home
              </button>
              <button
                onClick={() => selectDomain(selectedDomain!)}
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
      <div className="bg-bg-dark flex flex-col">
        <Header showNav={true} />
        <div className="p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <h2 className="text-base md:text-lg lg:text-xl font-semibold text-text-primary">
              {DOMAINS[selectedDomain as keyof typeof DOMAINS]}
            </h2>
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
          <div className="bg-bg-card rounded-lg p-2.5 md:p-3 lg:p-4 mb-3">
            <h3 className="text-base md:text-lg text-text-primary mb-3 md:mb-4">
              {currentQuestion.question}
              {currentQuestion.isMultiAnswer && (
                <span className="text-aws-orange font-semibold ml-2">(Select 2)</span>
              )}
            </h3>

            <div className="space-y-2 md:space-y-3 mb-4">
              {Object.entries(currentQuestion.options).map(([key, value]) => {
                const isSelected = currentQuestion.isMultiAnswer
                  ? Array.isArray(userAnswer) && userAnswer.includes(key)
                  : userAnswer === key
                
                const currentSelections = currentQuestion.isMultiAnswer && Array.isArray(userAnswer) 
                  ? userAnswer.length 
                  : 0
                const isLimitReached = currentQuestion.isMultiAnswer && !isSelected && currentSelections >= 2
                
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
                    disabled={showFeedback || isLimitReached}
                  />
                )
              })}
            </div>

            {currentQuestion.isMultiAnswer && !showFeedback && (
              <div className="mb-3 text-xs md:text-sm text-text-muted">
                {Array.isArray(userAnswer) && userAnswer.length > 0 ? (
                  <span className="text-aws-orange font-medium">
                    {userAnswer.length}/2 answers selected
                  </span>
                ) : (
                  <span>Select 2 answers</span>
                )}
              </div>
            )}

            {currentQuestion.isMultiAnswer && !showFeedback && (
              <button
                onClick={() => checkAnswer()}
                disabled={!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)}
                className="w-full px-4 py-2 md:px-6 md:py-2.5 bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                Submit Answer
              </button>
            )}

            {showFeedback && (
              <div className={`mt-3 p-2.5 md:p-3 rounded-lg ${isCorrect ? 'bg-success/10 border border-success' : 'bg-danger/10 border border-danger'}`}>
                <div className={`font-semibold mb-2 flex items-center gap-2 text-sm md:text-base ${isCorrect ? 'text-success' : 'text-danger'}`}>
                  {isCorrect ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <X className="w-4 h-4 md:w-5 md:h-5" />}
                  <p>{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                </div>
                
                {!isCorrect && (
                  <div className="mb-2 text-xs md:text-sm">
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
                  <div className="border-t border-text-muted/20 pt-2 mt-2">
                    {currentQuestion.source === 'ai-generated' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-2">
                        <span>✦</span> AI Generated
                      </span>
                    )}
                    <p className="text-text-muted text-xs md:text-sm font-medium mb-1">Explanation:</p>
                    <p className="text-text-muted text-xs md:text-sm">{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Question ID */}
            <div className="mt-3 pt-2 border-t border-text-muted/20">
              <span className="text-xs text-text-muted/70 font-mono">{currentQuestion.id}</span>
            </div>
          </div>

          {showFeedback && (
            <button
              onClick={nextQuestion}
              className="w-full px-4 py-2 md:px-6 md:py-2.5 bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold rounded-lg transition-colors text-sm md:text-base"
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
