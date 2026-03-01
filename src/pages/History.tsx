import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Header } from '../components/Header'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { DOMAINS, DOMAIN_COLORS } from '../types'
import type { Question } from '../types'
import { formatDuration } from '../lib/scoring'
import { formatRelativeDate } from '../lib/formatting'
import { loadAllQuestions } from '../data/questions'
import { Modal } from '../components/Modal'
import { QuestionReviewCard } from '../components/QuestionReviewCard'
import { TrendingUp, Check, X, Trash2, AlertTriangle } from 'lucide-react'

interface AttemptQuestionRow {
  question_id: string
  user_answer: string | null
  correct_answer: string
  is_correct: boolean
  was_flagged: boolean
  domain_id: number
}

interface ExamAttempt {
  id: string
  attempted_at: string
  score_percent: number
  scaled_score: number
  passed: boolean
  time_taken_seconds: number
  total_questions: number
  correct_answers: number
  domain_1_score: number
  domain_2_score: number
  domain_3_score: number
  domain_4_score: number
}

export function History() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])

  // Set page title
  useEffect(() => {
    document.title = "My Exam History | CloudCertPrep"
    return () => {
      document.title = "CloudCertPrep | Free AWS CLF-C02 Practice Exams"
    }
  }, [])
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all')
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null)
  const [itemsPerPage, setItemsPerPage] = useState(3)
  const [currentPage, setCurrentPage] = useState(1)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  // Question review state
  const [questionBank, setQuestionBank] = useState<Question[]>([])
  const [attemptQuestions, setAttemptQuestions] = useState<Map<string, AttemptQuestionRow[]>>(new Map())
  const [reviewLoading, setReviewLoading] = useState<string | null>(null)
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'flagged'>('all')
  const [reviewDomainFilter, setReviewDomainFilter] = useState<number | null>(null)
  const [reviewQuestionIndex, setReviewQuestionIndex] = useState(0)

  useEffect(() => {
    loadHistory()
  }, [user])

  // Reset to page 1 when filter or items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, itemsPerPage])

  async function loadHistory() {
    try {
      if (!user?.id) {
        setAttempts([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('attempted_at', { ascending: false })

      if (error) throw error
      setAttempts(data || [])
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleExpandAttempt(attemptId: string) {
    // Toggle collapse
    if (expandedAttempt === attemptId) {
      setExpandedAttempt(null)
      return
    }

    setExpandedAttempt(attemptId)
    setReviewFilter('all')
    setReviewDomainFilter(null)
    setReviewQuestionIndex(0)

    // Already fetched this attempt's questions
    if (attemptQuestions.has(attemptId)) return

    setReviewLoading(attemptId)
    try {
      // Load question bank if not already loaded
      let bank = questionBank
      if (bank.length === 0) {
        bank = await loadAllQuestions()
        setQuestionBank(bank)
      }

      // Fetch attempt questions from Supabase
      const { data, error } = await supabase
        .from('attempt_questions')
        .select('question_id, user_answer, correct_answer, is_correct, was_flagged, domain_id')
        .eq('attempt_id', attemptId)
        .order('domain_id', { ascending: true })

      if (error) throw error

      setAttemptQuestions(prev => new Map(prev).set(attemptId, data || []))
    } catch (error) {
      console.error('Error loading attempt questions:', error)
    } finally {
      setReviewLoading(null)
    }
  }

  async function handleResetProgress() {
    if (!user?.id) return
    setResetting(true)
    try {
      const { error: e1 } = await supabase
        .from('attempt_questions')
        .delete()
        .eq('user_id', user.id)
      if (e1) throw e1

      const { error: e2 } = await supabase
        .from('exam_attempts')
        .delete()
        .eq('user_id', user.id)
      if (e2) throw e2

      const { error: e3 } = await supabase
        .from('domain_progress')
        .delete()
        .eq('user_id', user.id)
      if (e3) throw e3

      setAttempts([])
      setShowResetModal(false)
      setResetSuccess(true)
      setTimeout(() => setResetSuccess(false), 3000)
    } catch (error) {
      console.error('Error resetting progress:', error)
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-bg-dark flex flex-col">
        <Header showNav={true} />
        <div className="flex-1 flex items-center justify-center p-8">
          <LoadingSpinner text="Loading history..." />
        </div>
      </div>
    )
  }

  const filteredAttempts = attempts.filter(a => {
    if (filter === 'passed') return a.passed
    if (filter === 'failed') return !a.passed
    return true
  })

  // Pagination logic
  const totalPages = itemsPerPage === 999999 ? 1 : Math.ceil(filteredAttempts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = itemsPerPage === 999999 ? filteredAttempts.length : startIndex + itemsPerPage
  const paginatedAttempts = filteredAttempts.slice(startIndex, endIndex)

  const passedAttempts = attempts.filter(a => a.passed).length


  return (
    <div className="bg-bg-dark flex flex-col">
      <Header showNav={true} />
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-semibold text-text-primary">Mock Exam History</h1>
            {user && attempts.length > 0 && (
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-bg-card hover:bg-danger/10 text-text-muted hover:text-danger border border-text-muted/20 hover:border-danger rounded-lg transition-colors text-xs md:text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">Reset Progress</span>
              </button>
            )}
          </div>

          {/* Reset Success Banner */}
          {resetSuccess && (
            <div className="mb-4 bg-success/10 border border-success text-success px-4 py-3 rounded-lg text-sm">
              All progress has been reset successfully.
            </div>
          )}

        {/* Filter Tabs and Pagination Controls - Only show for logged in users */}
        {user && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-aws-orange text-white'
                  : 'bg-bg-card text-text-muted hover:text-text-primary'
              }`}
            >
              All ({attempts.length})
            </button>
            <button
              onClick={() => setFilter('passed')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'passed'
                  ? 'bg-success text-white'
                  : 'bg-bg-card text-text-muted hover:text-text-primary'
              }`}
            >
              Passed ({passedAttempts})
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'failed'
                  ? 'bg-danger text-white'
                  : 'bg-bg-card text-text-muted hover:text-text-primary'
              }`}
            >
              Failed ({attempts.length - passedAttempts})
            </button>
            </div>

            {/* Items per page dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-sm">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-2 bg-bg-card text-text-primary rounded-lg border border-bg-dark hover:border-aws-orange/50 transition-colors text-sm"
              >
                <option value={3}>3 per page</option>
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={999999}>All</option>
              </select>
            </div>
          </div>
        )}

        {/* Guest User Empty State */}
        {!user && (
          <div className="mb-6 p-6 bg-warning/10 border border-warning rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-warning" />
              <p className="text-warning font-semibold">Track Your Progress</p>
            </div>
            <p className="text-text-muted text-sm mb-4">
              Sign in to track your mock exam history and monitor your progress over time.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-aws-orange hover:bg-aws-orange/90 text-white font-medium rounded-lg transition-colors"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Showing counter */}
        {user && filteredAttempts.length > 0 && (
          <div className="mb-4 text-sm text-text-muted">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAttempts.length)} of {filteredAttempts.length} attempts
          </div>
        )}

        {/* Attempts List */}
        {filteredAttempts.length === 0 ? (
          <div className="bg-bg-card rounded-lg p-12 text-center shadow-card">
            <p className="text-text-muted text-lg">
              {filter === 'all' 
                ? 'No exam attempts yet. Take your first mock exam!' 
                : `No ${filter} attempts yet.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => navigate('/mock-exam')}
                className="mt-6 px-8 py-3 bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold rounded-lg transition-colors"
              >
                Start Mock Exam
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedAttempts.map(attempt => (
              <div key={attempt.id} className="bg-bg-card rounded-lg p-4 md:p-6 shadow-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${attempt.passed ? 'bg-success/20' : 'bg-danger/20'}`}>
                      {attempt.passed ? (
                        <Check className="w-5 h-5 md:w-6 md:h-6 text-success" />
                      ) : (
                        <X className="w-5 h-5 md:w-6 md:h-6 text-danger" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm md:text-base font-semibold text-text-primary">
                          {attempt.passed ? 'Passed' : 'Failed'}
                        </h3>
                        <span className="text-text-muted text-xs">·</span>
                        <span className="text-text-muted text-xs">{formatRelativeDate(attempt.attempted_at)}</span>
                        <span className="text-text-muted text-xs">·</span>
                        <span className="text-text-muted text-xs">{formatDuration(attempt.time_taken_seconds)}</span>
                      </div>
                      <p className="text-text-muted text-xs md:text-sm mt-0.5">
                        {attempt.correct_answers}/{attempt.total_questions} correct ({Math.round(attempt.score_percent)}%)
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl md:text-2xl font-bold text-text-primary">{attempt.scaled_score}</p>
                    <p className="text-text-muted text-[10px]">/ 1000</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs md:text-sm font-semibold text-text-primary mb-2">Domain Breakdown</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(domainId => {
                      const score = attempt[`domain_${domainId}_score` as keyof ExamAttempt] as number
                      return (
                        <div key={domainId} className="flex items-center justify-between">
                          <span className="text-text-muted text-xs md:text-sm">
                            {DOMAINS[domainId as keyof typeof DOMAINS]}
                          </span>
                          <span 
                            className="text-sm md:text-base font-bold"
                            style={{ color: DOMAIN_COLORS[domainId as keyof typeof DOMAIN_COLORS] }}
                          >
                            {score}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* View Details Button */}
                <div className="mt-3 pt-3 border-t border-bg-dark">
                  <button
                    onClick={() => handleExpandAttempt(attempt.id)}
                    className="w-full px-4 py-2 bg-bg-dark hover:bg-bg-dark/70 text-aws-orange font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    {expandedAttempt === attempt.id ? '▼' : '▶'} View Details
                  </button>
                  
                  {expandedAttempt === attempt.id && (
                    <div className="mt-3">
                      {reviewLoading === attempt.id ? (
                        <div className="flex items-center justify-center p-8">
                          <LoadingSpinner text="Loading questions..." />
                        </div>
                      ) : attemptQuestions.has(attempt.id) ? (
                        (() => {
                          const aqList = attemptQuestions.get(attempt.id)!
                          const filtered = aqList.filter(aq => {
                            if (reviewFilter === 'incorrect' && aq.is_correct) return false
                            if (reviewFilter === 'flagged' && !aq.was_flagged) return false
                            if (reviewDomainFilter !== null && aq.domain_id !== reviewDomainFilter) return false
                            return true
                          })
                          const currentAq = filtered[reviewQuestionIndex]
                          const originalQ = currentAq ? questionBank.find(q => q.id === currentAq.question_id) : null

                          return (
                            <div className="space-y-3">
                              {/* Review Filters */}
                              <div className="flex flex-wrap gap-2">
                                {(['all', 'incorrect', 'flagged'] as const).map(f => {
                                  const count = f === 'all' ? aqList.length
                                    : f === 'incorrect' ? aqList.filter(q => !q.is_correct).length
                                    : aqList.filter(q => q.was_flagged).length
                                  const isDisabled = f !== 'all' && count === 0
                                  return (
                                    <button
                                      key={f}
                                      onClick={() => { if (!isDisabled) { setReviewFilter(f); setReviewQuestionIndex(0) } }}
                                      disabled={isDisabled}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        reviewFilter === f
                                          ? 'bg-aws-orange text-white'
                                          : isDisabled
                                          ? 'bg-bg-dark text-text-muted opacity-50 cursor-not-allowed'
                                          : 'bg-bg-dark text-text-muted hover:text-text-primary'
                                      }`}
                                    >
                                      {f === 'all' ? 'All' : f === 'incorrect' ? 'Incorrect' : 'Flagged'} ({count})
                                    </button>
                                  )
                                })}
                              </div>

                              {/* Domain Filter */}
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => { setReviewDomainFilter(null); setReviewQuestionIndex(0) }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    reviewDomainFilter === null ? 'bg-aws-orange text-white' : 'bg-bg-dark text-text-muted hover:text-text-primary'
                                  }`}
                                >
                                  All Domains
                                </button>
                                {[1, 2, 3, 4].map(domainId => (
                                  <button
                                    key={domainId}
                                    onClick={() => { setReviewDomainFilter(reviewDomainFilter === domainId ? null : domainId); setReviewQuestionIndex(0) }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                      reviewDomainFilter === domainId ? 'text-white' : 'bg-bg-dark text-text-muted hover:text-text-primary'
                                    }`}
                                    style={reviewDomainFilter === domainId ? { backgroundColor: DOMAIN_COLORS[domainId as keyof typeof DOMAIN_COLORS] } : {}}
                                  >
                                    {DOMAINS[domainId as keyof typeof DOMAINS]}
                                  </button>
                                ))}
                              </div>

                              {/* Question Number Grid */}
                              <div className="grid grid-cols-[repeat(auto-fit,minmax(32px,32px))] md:grid-cols-[repeat(auto-fit,minmax(36px,36px))] gap-0.5 md:gap-1 justify-center">
                                {aqList.map((aq, idx) => {
                                  const isInFiltered = filtered.some(f => f.question_id === aq.question_id)
                                  const isCurrent = currentAq?.question_id === aq.question_id
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        const fIdx = filtered.findIndex(f => f.question_id === aq.question_id)
                                        if (fIdx !== -1) setReviewQuestionIndex(fIdx)
                                      }}
                                      disabled={!isInFiltered}
                                      className={`w-8 h-8 md:w-9 md:h-9 rounded text-[10px] md:text-xs font-medium transition-all ${
                                        isCurrent ? 'ring-2 ring-aws-orange ring-offset-1 ring-offset-bg-card' : ''
                                      } ${!isInFiltered ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'} ${
                                        aq.is_correct ? 'bg-success text-white' : 'bg-danger text-white'
                                      } ${aq.was_flagged ? 'ring-2 ring-warning' : ''}`}
                                    >
                                      {idx + 1}
                                    </button>
                                  )
                                })}
                              </div>
                              <div className="flex items-center justify-center gap-4 text-xs text-text-muted">
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-success rounded"></span> Correct</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-danger rounded"></span> Incorrect</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-bg-dark rounded ring-2 ring-warning"></span> Flagged</span>
                              </div>

                              {/* Current Question Display */}
                              {currentAq && originalQ ? (
                                <QuestionReviewCard
                                  question={originalQ}
                                  userAnswer={currentAq.user_answer || ''}
                                  isCorrect={currentAq.is_correct}
                                  wasFlagged={currentAq.was_flagged}
                                  questionNumber={reviewQuestionIndex + 1}
                                  totalQuestions={filtered.length}
                                />
                              ) : filtered.length === 0 ? (
                                <div className="bg-bg-dark rounded-lg p-4 text-center">
                                  <p className="text-text-muted text-sm">No questions match the selected filters.</p>
                                </div>
                              ) : null}
                            </div>
                          )
                        })()
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Page Navigation */}
        {user && filteredAttempts.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-bg-card hover:bg-bg-card-hover text-text-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              ← Previous
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors text-sm ${
                      currentPage === pageNum
                        ? 'bg-aws-orange text-white'
                        : 'bg-bg-card hover:bg-bg-card-hover text-text-primary'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-bg-card hover:bg-bg-card-hover text-text-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Next →
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Reset Progress Confirmation Modal */}
      <Modal isOpen={showResetModal} title="Reset All Progress" onClose={() => setShowResetModal(false)}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-danger/10 border border-danger rounded-lg">
            <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-text-primary text-sm font-medium mb-1">This action cannot be undone</p>
              <p className="text-text-muted text-sm">
                This will permanently delete all your exam history, question responses, and domain mastery progress. You will start fresh as if you just created your account.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowResetModal(false)}
              className="flex-1 px-4 py-3 bg-bg-dark hover:bg-bg-card-hover text-text-primary font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResetProgress}
              disabled={resetting}
              className="flex-1 px-4 py-3 bg-danger hover:bg-danger/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetting ? 'Resetting...' : 'Reset Everything'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
