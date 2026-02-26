import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cloud, Check } from 'lucide-react'
import { useTimer } from '../hooks/useTimer'
import { useAuth } from '../hooks/useAuth'
import { Header } from '../components/Header'
import { AnswerButton } from '../components/AnswerButton'
import { Modal } from '../components/Modal'
import { PassFailBanner } from '../components/PassFailBanner'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { selectExamQuestions, calculateScaledScore, isPassed, getDomainScore, formatTime, formatDuration, isAnswerCorrect } from '../lib/scoring'
import { calculateDomainMastery } from '../lib/domainStats'
import { supabase } from '../lib/supabase'
import { DOMAINS, DOMAIN_COLORS } from '../types'
import type { Question } from '../types'
import masterQuestions from '../data/master_questions.json'
import { Flag, AlertCircle } from 'lucide-react'

type ExamScreen = 'start' | 'exam' | 'results' | 'review'

interface QuestionState {
  userAnswer: string | string[] | null
  flagged: boolean
}

export function MockExam() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [screen, setScreen] = useState<ExamScreen>('start')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<number, QuestionState>>(new Map())
  const [showEndModal, setShowEndModal] = useState(false)
  const [showQuestionNav, setShowQuestionNav] = useState(false)
  const [results, setResults] = useState<{
    scaledScore: number
    percentScore: number
    passed: boolean
    correctCount: number
    totalQuestions: number
    timeTaken: number
    domain1Score: number
    domain2Score: number
    domain3Score: number
    domain4Score: number
    questionResults: Array<{
      questionId: string
      domainId: number
      userAnswer: string | string[]
      correctAnswer: string | string[]
      isCorrect: boolean
      wasFlagged: boolean
    }>
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'flagged'>('all')
  const [reviewDomainFilter, setReviewDomainFilter] = useState<number | null>(null)
  const [reviewQuestionIndex, setReviewQuestionIndex] = useState(0)

  const timer = useTimer({
    initialSeconds: 90 * 60, // 90 minutes
    onComplete: handleTimeUp,
  })

  // Set dynamic page title based on screen and question
  useEffect(() => {
    if (screen === 'start') {
      document.title = "Mock Exam | CloudCertPrep"
    } else if (screen === 'exam') {
      document.title = `Question ${currentIndex + 1} of 65 | CloudCertPrep Mock Exam`
    } else if (screen === 'results') {
      document.title = "Exam Results | CloudCertPrep"
    } else if (screen === 'review') {
      document.title = "Review Exam | CloudCertPrep"
    }
    return () => {
      document.title = "CloudCertPrep | Free AWS CLF-C02 Practice Exams"
    }
  }, [screen, currentIndex])

  function handleTimeUp() {
    handleSubmitExam()
  }

  function startExam() {
    const selectedQuestions = selectExamQuestions(masterQuestions as Question[])
    setQuestions(selectedQuestions)
    setAnswers(new Map())
    setCurrentIndex(0)
    setScreen('exam')
    setStartTime(Date.now())
    timer.start()
  }

  function handleAnswer(answer: string) {
    const current = questions[currentIndex]
    const currentState = answers.get(currentIndex) || { userAnswer: null, flagged: false }
    
    if (current.isMultiAnswer) {
      const currentAnswers = Array.isArray(currentState.userAnswer) ? currentState.userAnswer : []
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
      
      setAnswers(new Map(answers.set(currentIndex, { ...currentState, userAnswer: newAnswers })))
    } else {
      setAnswers(new Map(answers.set(currentIndex, { ...currentState, userAnswer: answer })))
    }
  }

  function toggleFlag() {
    const currentState = answers.get(currentIndex) || { userAnswer: null, flagged: false }
    setAnswers(new Map(answers.set(currentIndex, { ...currentState, flagged: !currentState.flagged })))
  }

  function goToQuestion(index: number) {
    setCurrentIndex(index)
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  function previousQuestion() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  async function handleSubmitExam() {
    setLoading(true)
    timer.pause()

    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    const isGuest = !user
    const isTooShort = timeTaken < 60
    
    const results = questions.map((q, idx) => {
      const state = answers.get(idx)
      const userAnswer = state?.userAnswer || (q.isMultiAnswer ? [] : '')
      const correct = isAnswerCorrect(userAnswer, q.answer, q.isMultiAnswer)
      
      return {
        questionId: q.id,
        domainId: q.domainId,
        userAnswer,
        correctAnswer: q.answer,
        isCorrect: correct,
        wasFlagged: state?.flagged || false,
      }
    })

    const correctCount = results.filter(r => r.isCorrect).length
    const scaledScore = calculateScaledScore(correctCount, questions.length)
    const passed = isPassed(scaledScore)
    const percentScore = (correctCount / questions.length) * 100

    const domain1Score = getDomainScore(results, 1)
    const domain2Score = getDomainScore(results, 2)
    const domain3Score = getDomainScore(results, 3)
    const domain4Score = getDomainScore(results, 4)

    try {
      // Only save to database if user is logged in AND exam took at least 60 seconds
      if (!isGuest && !isTooShort) {
        const { data: attemptData, error: attemptError } = await supabase
        .from('exam_attempts')
        .insert({
          user_id: user?.id,
          score_percent: percentScore,
          scaled_score: scaledScore,
          passed,
          time_taken_seconds: timeTaken,
          total_questions: questions.length,
          correct_answers: correctCount,
          domain_1_score: domain1Score,
          domain_2_score: domain2Score,
          domain_3_score: domain3Score,
          domain_4_score: domain4Score,
        })
        .select()
        .single()

      if (attemptError) throw attemptError

      const questionRecords = results.map(r => ({
        attempt_id: attemptData.id,
        user_id: user?.id,
        question_id: r.questionId,
        user_answer: Array.isArray(r.userAnswer) ? r.userAnswer.join(',') : r.userAnswer,
        correct_answer: Array.isArray(r.correctAnswer) ? r.correctAnswer.join(',') : r.correctAnswer,
        is_correct: r.isCorrect,
        was_flagged: r.wasFlagged,
        domain_id: r.domainId,
      }))

      const { error: questionsError } = await supabase
        .from('attempt_questions')
        .insert(questionRecords)

      if (questionsError) throw questionsError

      // Update domain progress for all 4 domains
      for (let domainId = 1; domainId <= 4; domainId++) {
        const domainResults = results.filter(r => r.domainId === domainId)

        if (domainResults.length > 0) {
          // Get count of UNIQUE questions attempted for this domain (across all attempts)
          const { data: uniqueQuestions } = await supabase
            .from('attempt_questions')
            .select('question_id')
            .eq('user_id', user?.id)
            .eq('domain_id', domainId)

          // Count distinct question IDs
          const uniqueQuestionIds = new Set(uniqueQuestions?.map(q => q.question_id) || [])
          const totalUniqueAttempted = uniqueQuestionIds.size

          // Get count of UNIQUE questions answered correctly for this domain
          const { data: correctQuestions } = await supabase
            .from('attempt_questions')
            .select('question_id')
            .eq('user_id', user?.id)
            .eq('domain_id', domainId)
            .eq('is_correct', true)

          const uniqueCorrectIds = new Set(correctQuestions?.map(q => q.question_id) || [])
          const totalUniqueCorrect = uniqueCorrectIds.size

          const newMastery = calculateDomainMastery(totalUniqueCorrect, domainId as 1 | 2 | 3 | 4)

          const { error: progressError } = await supabase.from('domain_progress').upsert({
            user_id: user?.id,
            domain_id: domainId,
            questions_attempted: totalUniqueAttempted,
            questions_correct: totalUniqueCorrect,
            mastery_percent: newMastery,
          }, {
            onConflict: 'user_id,domain_id',
          })

          if (progressError) {
            console.error(`Error updating domain ${domainId} progress:`, progressError)
          }
        }
      }
    }

      setResults({
        scaledScore,
        percentScore,
        passed,
        correctCount,
        totalQuestions: questions.length,
        timeTaken,
        domain1Score,
        domain2Score,
        domain3Score,
        domain4Score,
        questionResults: results,
      })

      setScreen('results')
    } catch (error) {
      console.error('Error saving exam attempt:', error)
      alert('Error saving exam results. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const currentQuestion = questions[currentIndex]
  const currentState = answers.get(currentIndex)
  const answeredCount = Array.from(answers.values()).filter(s => s.userAnswer !== null && (Array.isArray(s.userAnswer) ? s.userAnswer.length > 0 : s.userAnswer !== '')).length
  const flaggedCount = Array.from(answers.values()).filter(s => s.flagged).length

  if (screen === 'start') {
    return (
      <div className="bg-bg-dark flex flex-col">
        <Header showNav={true} />
        <div className="p-4 md:p-8">
          <div className="max-w-2xl mx-auto bg-bg-card rounded-lg p-4 md:p-6 lg:p-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary mb-3 md:mb-4">Mock Exam</h1>
          <p className="text-sm md:text-base text-text-muted mb-6 md:mb-8">65 questions — 90 minutes — No answer feedback during exam</p>
          
          <div className="bg-bg-dark rounded-lg p-4 md:p-6 mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3 md:mb-4">Domain Breakdown</h2>
            <div className="space-y-1.5 md:space-y-2 text-sm md:text-base text-text-muted">
              <p>• 16 Cloud Concepts (24%)</p>
              <p>• 20 Security & Compliance (30%)</p>
              <p>• 22 Cloud Technology & Services (34%)</p>
              <p>• 7 Billing, Pricing & Support (12%)</p>
            </div>
          </div>

          <div className="bg-warning/10 border border-warning rounded-lg p-3 md:p-4 mb-6 md:mb-8">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-warning flex-shrink-0" />
              <p className="text-sm md:text-base text-warning font-medium">Once started, the timer cannot be paused</p>
            </div>
          </div>

          <button
            onClick={startExam}
            className="w-full bg-aws-orange hover:bg-aws-orange/90 text-white font-bold py-3 md:py-4 rounded-lg transition-colors text-base md:text-lg"
          >
            Start Exam
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-3 md:mt-4 bg-bg-dark hover:bg-bg-card-hover text-text-primary font-medium py-2.5 md:py-3 rounded-lg transition-colors text-sm md:text-base"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
    )
  }

  if (screen === 'results' && results) {
    return (
      <div className="bg-bg-dark flex flex-col">
        <Header showNav={true} />
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
          <PassFailBanner
            passed={results.passed}
            scaledScore={results.scaledScore}
            percent={results.percentScore}
          />

          <div className="mt-8 bg-bg-card rounded-lg p-6">
            <div className="bg-aws-orange/10 border border-aws-orange/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-text-muted">
                <span className="font-semibold text-aws-orange">AWS Scaled Scoring:</span> Scores range from 100-1000, where 100 is the minimum (0% correct) and 1000 is the maximum (100% correct). You need 700+ to pass.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-text-muted text-sm mb-1">Pass Mark</p>
                <p className="text-2xl font-bold text-text-primary">700/1000</p>
              </div>
              <div>
                <p className="text-text-muted text-sm mb-1">Time Taken</p>
                <p className="text-2xl font-bold text-text-primary">{formatDuration(results.timeTaken)}</p>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-text-primary mb-4">Domain Breakdown</h3>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(domainId => {
                const domainScores = [results.domain1Score, results.domain2Score, results.domain3Score, results.domain4Score]
                const score = domainScores[domainId - 1]
                const domainQuestions = results.questionResults.filter(r => r.domainId === domainId)
                const correct = domainQuestions.filter(r => r.isCorrect).length
                
                return (
                  <div key={domainId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-text-primary font-medium">{DOMAINS[domainId as keyof typeof DOMAINS]}</p>
                      <p className="text-text-muted text-sm">{correct}/{domainQuestions.length} correct</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold" style={{ color: DOMAIN_COLORS[domainId as keyof typeof DOMAIN_COLORS] }}>
                        {score}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => {
                setReviewFilter('all')
                setReviewDomainFilter(null)
                setReviewQuestionIndex(0)
                setScreen('review')
              }}
              className="w-full bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Review Exam Questions
            </button>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-bg-card hover:bg-bg-card-hover text-text-primary font-semibold py-3 rounded-lg transition-colors"
              >
                ← Back to Home
              </button>
              <button
                onClick={() => {
                  setScreen('start')
                  setResults(null)
                }}
                className="flex-1 bg-bg-card hover:bg-bg-card-hover text-text-primary font-semibold py-3 rounded-lg transition-colors"
              >
                Retake Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  }

  if (screen === 'exam' && currentQuestion) {
    return (
      <div className="bg-bg-dark">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-aws-orange to-[#FF7700] shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-4 py-2 md:py-4 lg:py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 lg:w-14 md:h-12 lg:h-14 bg-white rounded-lg flex items-center justify-center shadow-md relative">
                  <Cloud className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-aws-orange" fill="currentColor" />
                  <Check className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white absolute" strokeWidth={3} />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight">CloudCertPrep</h1>
                  <p className="text-xs md:text-sm text-white/90 font-medium hidden lg:block">
                    AWS Cloud Practitioner Exam Prep
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`text-lg md:text-xl lg:text-2xl font-mono font-bold text-white ${timer.seconds < 600 ? 'animate-pulse' : ''}`}>
                  {formatTime(timer.seconds)}
                </div>
                <button
                  onClick={() => setShowEndModal(true)}
                  className="px-4 py-2 md:px-6 md:py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-lg transition-colors text-sm md:text-base"
                >
                  End Exam
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-24 md:pt-28 lg:pt-32 pb-6 px-4 md:px-8">
          <div className="max-w-7xl mx-auto flex gap-6">
            {/* Main Content */}
            <div className="flex-1">
            {/* Mobile Question Navigation Button */}
            <button
              onClick={() => setShowQuestionNav(true)}
              className="lg:hidden w-full mb-4 px-4 py-2 bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold rounded-lg transition-colors flex items-center justify-between"
            >
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span className="text-sm">View All Questions →</span>
            </button>

            <div className="bg-bg-card rounded-lg p-2.5 md:p-3 lg:p-4 mb-3">
              <div className="hidden lg:flex items-center justify-end mb-2">
                <span className="text-text-muted text-xs md:text-sm">Question {currentIndex + 1} of {questions.length}</span>
              </div>

              <h2 className="text-base md:text-lg text-text-primary mb-3 md:mb-4">
                {currentQuestion.question}
                {currentQuestion.isMultiAnswer && (
                  <span className="text-aws-orange font-semibold ml-2">(Select 2)</span>
                )}
              </h2>

              <div className="space-y-2 md:space-y-3 mb-4">
                {Object.entries(currentQuestion.options).map(([key, value]) => {
                  const isSelected = currentQuestion.isMultiAnswer
                    ? Array.isArray(currentState?.userAnswer) && currentState.userAnswer.includes(key)
                    : currentState?.userAnswer === key
                  
                  const currentSelections = currentQuestion.isMultiAnswer && Array.isArray(currentState?.userAnswer) 
                    ? currentState.userAnswer.length 
                    : 0
                  const isDisabled = currentQuestion.isMultiAnswer && !isSelected && currentSelections >= 2
                  
                  return (
                    <AnswerButton
                      key={key}
                      label={key as any}
                      text={value}
                      state={isSelected ? 'selected' : 'default'}
                      onClick={() => handleAnswer(key)}
                      disabled={isDisabled}
                    />
                  )
                })}
              </div>

              {currentQuestion.isMultiAnswer && (
                <div className="mb-3 text-xs md:text-sm text-text-muted">
                  {Array.isArray(currentState?.userAnswer) && currentState.userAnswer.length > 0 ? (
                    <span className="text-aws-orange font-medium">
                      {currentState.userAnswer.length}/2 answers selected
                    </span>
                  ) : (
                    <span>Select 2 answers</span>
                  )}
                </div>
              )}

              <button
                onClick={toggleFlag}
                className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors text-sm ${
                  currentState?.flagged
                    ? 'bg-warning/20 text-warning border border-warning'
                    : 'bg-bg-dark text-text-muted hover:text-text-primary'
                }`}
              >
                <Flag className={`w-4 h-4 md:w-5 md:h-5 ${currentState?.flagged ? 'fill-warning' : ''}`} />
                <span className="font-medium text-xs md:text-sm">{currentState?.flagged ? 'Flagged for Review' : 'Flag for Review'}</span>
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={previousQuestion}
                disabled={currentIndex === 0}
                className="flex-1 px-6 py-3 bg-bg-card hover:bg-bg-card-hover text-text-primary font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={nextQuestion}
                disabled={currentIndex === questions.length - 1}
                className="flex-1 px-6 py-3 bg-bg-card hover:bg-bg-card-hover text-text-primary font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
            </div>

            {/* Question Grid Sidebar */}
            <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-bg-card rounded-lg p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, idx) => {
                  const state = answers.get(idx)
                  const isAnswered = state?.userAnswer !== null && state?.userAnswer !== undefined && (Array.isArray(state.userAnswer) ? state.userAnswer.length > 0 : state.userAnswer !== '')
                  const isFlagged = state?.flagged || false
                  const isCurrent = idx === currentIndex

                  return (
                    <button
                      key={idx}
                      onClick={() => goToQuestion(idx)}
                      className={`relative w-10 h-10 rounded text-sm font-medium transition-colors ${
                        isCurrent
                          ? 'bg-aws-orange text-white'
                          : isAnswered
                          ? 'bg-aws-orange/30 text-text-primary hover:bg-aws-orange/50'
                          : 'bg-bg-dark text-text-muted hover:bg-bg-card-hover'
                      }`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <Flag className="absolute -top-1 -right-1 w-3 h-3 text-warning fill-warning" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Question Navigation Modal (Mobile/Tablet) */}
        <Modal isOpen={showQuestionNav} title="Questions" onClose={() => setShowQuestionNav(false)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-text-muted mb-4">
              <span>Answered: {answeredCount}/{questions.length}</span>
              <span>Flagged: {flaggedCount}</span>
            </div>
            <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
              {questions.map((_, idx) => {
                const state = answers.get(idx)
                const isAnswered = state?.userAnswer !== null && state?.userAnswer !== undefined && (Array.isArray(state.userAnswer) ? state.userAnswer.length > 0 : state.userAnswer !== '')
                const isFlagged = state?.flagged || false
                const isCurrent = idx === currentIndex

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      goToQuestion(idx)
                      setShowQuestionNav(false)
                    }}
                    className={`relative w-full aspect-square rounded text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'bg-aws-orange text-white'
                        : isAnswered
                        ? 'bg-aws-orange/30 text-text-primary hover:bg-aws-orange/50'
                        : 'bg-bg-dark text-text-muted hover:bg-bg-card-hover'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <Flag className="absolute -top-1 -right-1 w-3 h-3 text-warning fill-warning" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </Modal>

        {/* End Exam Modal */}
        <Modal isOpen={showEndModal} title="End Exam" onClose={() => setShowEndModal(false)}>
          <div className="space-y-4">
            <p className="text-text-primary">You have answered <span className="font-bold">{answeredCount}</span> of {questions.length} questions.</p>
            <p className="text-text-primary"><span className="font-bold">{flaggedCount}</span> questions are flagged for review.</p>
            
            {loading ? (
              <div className="py-8">
                <LoadingSpinner text="Submitting exam..." />
              </div>
            ) : (
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowEndModal(false)}
                  className="flex-1 px-6 py-3 bg-bg-dark hover:bg-bg-card-hover text-text-primary font-semibold rounded-lg transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleSubmitExam}
                  className="flex-1 px-6 py-3 bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold rounded-lg transition-colors"
                >
                  Submit Exam
                </button>
              </div>
            )}
          </div>
        </Modal>
      </div>
    )
  }

  // Review screen
  if (screen === 'review' && results) {
    const filteredQuestions = results.questionResults.filter(result => {
      // Apply filters
      if (reviewFilter === 'incorrect' && result.isCorrect) return false
      if (reviewFilter === 'flagged' && !result.wasFlagged) return false
      if (reviewDomainFilter !== null && result.domainId !== reviewDomainFilter) return false
      return true
    })

    if (filteredQuestions.length === 0) {
      return (
        <div className="bg-bg-dark flex flex-col min-h-screen">
          <Header showNav={true} />
          <div className="p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-bg-card rounded-lg p-8 text-center">
                <p className="text-text-muted text-lg mb-6">No questions match the selected filters.</p>
                <button
                  onClick={() => {
                    setReviewFilter('all')
                    setReviewDomainFilter(null)
                  }}
                  className="px-6 py-3 bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const currentReviewQuestion = filteredQuestions[reviewQuestionIndex]
    const originalQuestion = questions.find(q => q.id === currentReviewQuestion.questionId)!

    return (
      <div className="bg-bg-dark flex flex-col min-h-screen">
        <Header showNav={true} />
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Filter Controls */}
            <div className="bg-bg-card rounded-lg p-4 mb-4">
              <div className="space-y-3">
                {/* Filter Buttons */}
                <div>
                  <span className="text-text-muted text-xs md:text-sm font-medium mb-2 block">Filter:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setReviewFilter('all')
                        setReviewQuestionIndex(0)
                      }}
                      className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                        reviewFilter === 'all'
                          ? 'bg-aws-orange text-white'
                          : 'bg-bg-dark text-text-muted hover:text-text-primary'
                      }`}
                    >
                      All ({results.questionResults.length})
                    </button>
                    <button
                      onClick={() => {
                        const incorrectCount = results.questionResults.filter(r => !r.isCorrect).length
                        if (incorrectCount > 0) {
                          setReviewFilter('incorrect')
                          setReviewQuestionIndex(0)
                        }
                      }}
                      disabled={results.questionResults.filter(r => !r.isCorrect).length === 0}
                      className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                        reviewFilter === 'incorrect'
                          ? 'bg-aws-orange text-white'
                          : results.questionResults.filter(r => !r.isCorrect).length === 0
                          ? 'bg-bg-dark text-text-muted opacity-50 cursor-not-allowed'
                          : 'bg-bg-dark text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Incorrect ({results.questionResults.filter(r => !r.isCorrect).length})
                    </button>
                    <button
                      onClick={() => {
                        const flaggedCount = results.questionResults.filter(r => r.wasFlagged).length
                        if (flaggedCount > 0) {
                          setReviewFilter('flagged')
                          setReviewQuestionIndex(0)
                        }
                      }}
                      disabled={results.questionResults.filter(r => r.wasFlagged).length === 0}
                      className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                        reviewFilter === 'flagged'
                          ? 'bg-aws-orange text-white'
                          : results.questionResults.filter(r => r.wasFlagged).length === 0
                          ? 'bg-bg-dark text-text-muted opacity-50 cursor-not-allowed'
                          : 'bg-bg-dark text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Flagged ({results.questionResults.filter(r => r.wasFlagged).length})
                    </button>
                  </div>
                </div>

                {/* Domain Filter Buttons */}
                <div>
                  <span className="text-text-muted text-xs md:text-sm font-medium mb-2 block">Domain:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setReviewDomainFilter(null)
                        setReviewQuestionIndex(0)
                      }}
                      className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                        reviewDomainFilter === null
                          ? 'bg-aws-orange text-white'
                          : 'bg-bg-dark text-text-muted hover:text-text-primary'
                      }`}
                    >
                      All Domains
                    </button>
                    {[1, 2, 3, 4].map(domainId => (
                      <button
                        key={domainId}
                        onClick={() => {
                          setReviewDomainFilter(reviewDomainFilter === domainId ? null : domainId)
                          setReviewQuestionIndex(0)
                        }}
                        className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                          reviewDomainFilter === domainId
                            ? 'text-white'
                            : 'bg-bg-dark text-text-muted hover:text-text-primary'
                        }`}
                        style={reviewDomainFilter === domainId ? { backgroundColor: DOMAIN_COLORS[domainId as keyof typeof DOMAIN_COLORS] } : {}}
                      >
                        {DOMAINS[domainId as keyof typeof DOMAINS]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Number Grid */}
                <div>
                  <h3 className="text-xs md:text-sm font-semibold text-text-muted mb-2 text-center">Questions:</h3>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(32px,32px))] md:grid-cols-[repeat(auto-fit,minmax(40px,40px))] gap-1.5 md:gap-2 justify-center">
                    {results.questionResults.map((result, idx) => {
                      const isCurrentQuestion = filteredQuestions[reviewQuestionIndex]?.questionId === result.questionId
                      const isInFilteredSet = filteredQuestions.some(fq => fq.questionId === result.questionId)
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            const filteredIdx = filteredQuestions.findIndex(fq => fq.questionId === result.questionId)
                            if (filteredIdx !== -1) {
                              setReviewQuestionIndex(filteredIdx)
                            }
                          }}
                          disabled={!isInFilteredSet}
                          className={`w-8 h-8 md:w-10 md:h-10 rounded text-xs md:text-sm font-medium transition-all ${
                            isCurrentQuestion
                              ? 'ring-2 ring-aws-orange ring-offset-2 ring-offset-bg-card'
                              : ''
                          } ${
                            !isInFilteredSet
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:scale-110'
                          } ${
                            result.isCorrect
                              ? 'bg-success text-white'
                              : 'bg-danger text-white'
                          } ${
                            result.wasFlagged
                              ? 'ring-2 ring-warning'
                              : ''
                          }`}
                        >
                          {idx + 1}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-success rounded"></span> Correct
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-danger rounded"></span> Incorrect
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-bg-dark rounded ring-2 ring-warning"></span> Flagged
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Display */}
            <div className="bg-bg-card rounded-lg p-4 md:p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-text-muted text-sm">
                    Question {reviewQuestionIndex + 1} of {filteredQuestions.length}
                  </span>
                  {currentReviewQuestion.wasFlagged && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-warning/20 text-warning rounded text-xs font-medium">
                      <Flag className="w-3 h-3 fill-warning" />
                      Flagged
                    </span>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-lg font-semibold text-sm ${
                  currentReviewQuestion.isCorrect
                    ? 'bg-success/20 text-success'
                    : 'bg-danger/20 text-danger'
                }`}>
                  {currentReviewQuestion.isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
                </div>
              </div>

              <div className="mb-3">
                <span className="text-xs font-medium px-2 py-1 rounded" style={{ 
                  backgroundColor: `${DOMAIN_COLORS[currentReviewQuestion.domainId as keyof typeof DOMAIN_COLORS]}20`,
                  color: DOMAIN_COLORS[currentReviewQuestion.domainId as keyof typeof DOMAIN_COLORS]
                }}>
                  {DOMAINS[currentReviewQuestion.domainId as keyof typeof DOMAINS]}
                </span>
              </div>

              <h3 className="text-base md:text-lg text-text-primary mb-4">
                {originalQuestion.question}
                {originalQuestion.isMultiAnswer && (
                  <span className="text-aws-orange font-semibold ml-2">(Multi-answer)</span>
                )}
              </h3>

              <div className="space-y-2 mb-6">
                {Object.entries(originalQuestion.options).map(([key, value]) => {
                  const userAnswerArray = Array.isArray(currentReviewQuestion.userAnswer) 
                    ? currentReviewQuestion.userAnswer 
                    : [currentReviewQuestion.userAnswer]
                  const correctAnswerArray = Array.isArray(currentReviewQuestion.correctAnswer)
                    ? currentReviewQuestion.correctAnswer
                    : [currentReviewQuestion.correctAnswer]
                  
                  const isUserAnswer = userAnswerArray.includes(key)
                  const isCorrectAnswer = correctAnswerArray.includes(key)
                  
                  let state: 'default' | 'selected' | 'correct' | 'wrong' = 'default'
                  if (isCorrectAnswer) {
                    state = 'correct'
                  } else if (isUserAnswer) {
                    state = 'wrong'
                  }

                  return (
                    <AnswerButton
                      key={key}
                      label={key as any}
                      text={value}
                      state={state}
                      onClick={() => {}}
                      disabled={true}
                    />
                  )
                })}
              </div>

              {originalQuestion.explanation && (
                <div className="bg-bg-dark rounded-lg p-4 border-l-4 border-aws-orange">
                  {originalQuestion.source === 'ai-generated' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-2">
                      <span>✦</span> AI Generated
                    </span>
                  )}
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Explanation:</h4>
                  <p className="text-sm text-text-muted">{originalQuestion.explanation}</p>
                </div>
              )}

              {/* Question ID */}
              <div className="mt-3 pt-2 border-t border-gray-700">
                <span className="text-xs text-gray-600 font-mono">{originalQuestion.id}</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setReviewQuestionIndex(Math.max(0, reviewQuestionIndex - 1))}
                disabled={reviewQuestionIndex === 0}
                className="flex-1 px-6 py-3 bg-bg-card hover:bg-bg-card-hover text-text-primary font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={() => setReviewQuestionIndex(Math.min(filteredQuestions.length - 1, reviewQuestionIndex + 1))}
                disabled={reviewQuestionIndex === filteredQuestions.length - 1}
                className="flex-1 px-6 py-3 bg-bg-card hover:bg-bg-card-hover text-text-primary font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>

            <button
              onClick={() => setScreen('results')}
              className="w-full px-6 py-3 bg-bg-dark hover:bg-bg-card-hover text-text-primary font-semibold rounded-lg transition-colors"
            >
              ← Back to Results
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
