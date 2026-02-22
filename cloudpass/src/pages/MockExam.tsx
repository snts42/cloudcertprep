import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

type ExamScreen = 'start' | 'exam' | 'results'

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

  const timer = useTimer({
    initialSeconds: 90 * 60, // 90 minutes
    onComplete: handleTimeUp,
  })

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
      // Only save to database if user is logged in
      if (!isGuest) {
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

      // Update weak spots
      for (const result of results) {
        if (!result.isCorrect) {
          await supabase.from('weak_spots').upsert({
            user_id: user?.id,
            question_id: result.questionId,
            incorrect_count: 1,
            correct_streak: 0,
            is_cleared: false,
          }, {
            onConflict: 'user_id,question_id',
            ignoreDuplicates: false,
          })
        }
      }

      // Update domain progress for all 4 domains
      for (let domainId = 1; domainId <= 4; domainId++) {
        const domainResults = results.filter(r => r.domainId === domainId)
        const domainCorrect = domainResults.filter(r => r.isCorrect).length
        const domainTotal = domainResults.length

        if (domainTotal > 0) {
          // Get existing progress
          const { data: existingProgress } = await supabase
            .from('domain_progress')
            .select('*')
            .eq('user_id', user?.id)
            .eq('domain_id', domainId)
            .single()

          const newAttempted = (existingProgress?.questions_attempted || 0) + domainTotal
          const newCorrect = (existingProgress?.questions_correct || 0) + domainCorrect
          const newMastery = calculateDomainMastery(newCorrect, domainId as 1 | 2 | 3 | 4)

          await supabase.from('domain_progress').upsert({
            user_id: user?.id,
            domain_id: domainId,
            domain_name: DOMAINS[domainId as keyof typeof DOMAINS],
            questions_attempted: newAttempted,
            questions_correct: newCorrect,
            mastery_percent: newMastery,
          }, {
            onConflict: 'user_id,domain_id',
          })
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

          <div className="mt-6 flex gap-4">
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
              className="flex-1 bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Retake Exam
            </button>
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
          <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
                <span className="text-base md:text-xl font-bold text-aws-orange">☁️</span>
              </div>
              <h1 className="text-sm md:text-lg font-bold text-white">CloudCertPrep</h1>
            </div>
            <div className={`text-base md:text-xl font-mono font-bold text-white ${timer.seconds < 600 ? 'animate-pulse' : ''}`}>
              {formatTime(timer.seconds)}
            </div>
            <button
              onClick={() => setShowEndModal(true)}
              className="px-3 py-1.5 md:px-5 md:py-2 bg-white/20 hover:bg-white/30 text-white text-xs md:text-sm font-semibold rounded-lg transition-colors"
            >
              End Exam
            </button>
          </div>
        </div>

        <div className="pt-20 pb-6 px-4 md:px-8 flex gap-6">
          {/* Main Content */}
          <div className="flex-1 max-w-3xl mx-auto">
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
          <div className="hidden lg:block w-64">
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

  return null
}
