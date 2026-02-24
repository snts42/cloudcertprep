import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Header } from '../components/Header'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { DOMAINS, DOMAIN_COLORS } from '../types'
import { formatDuration } from '../lib/scoring'
import { TrendingUp, Check, X } from 'lucide-react'

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

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <LoadingSpinner text="Loading history..." />
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

  function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 60) {
      return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
    } else if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  return (
    <div className="bg-bg-dark flex flex-col">
      <Header showNav={true} />
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary mb-4 md:mb-6">Mock Exam History</h1>

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
          <div className="bg-bg-card rounded-lg p-12 text-center">
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
              <div key={attempt.id} className="bg-bg-card rounded-lg p-4 md:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center ${attempt.passed ? 'bg-success/20' : 'bg-danger/20'}`}>
                      {attempt.passed ? (
                        <Check className="w-6 h-6 md:w-7 md:h-7 text-success" />
                      ) : (
                        <X className="w-6 h-6 md:w-7 md:h-7 text-danger" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-text-primary mb-1">
                        {attempt.passed ? 'Passed' : 'Failed'}
                      </h3>
                      <p className="text-text-muted text-xs md:text-sm">
                        {formatRelativeDate(attempt.attempted_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl md:text-3xl font-bold text-text-primary mb-1">{attempt.scaled_score}</p>
                    <p className="text-text-muted text-xs">/ 1000</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-3">
                  <div className="bg-bg-dark rounded-lg p-2 md:p-3">
                    <p className="text-text-muted text-xs mb-1">Score</p>
                    <p className="text-base md:text-lg font-bold text-text-primary">{Math.round(attempt.score_percent)}%</p>
                  </div>
                  <div className="bg-bg-dark rounded-lg p-2 md:p-3">
                    <p className="text-text-muted text-xs mb-1">Correct</p>
                    <p className="text-base md:text-lg font-bold text-text-primary">{attempt.correct_answers}/{attempt.total_questions}</p>
                  </div>
                  <div className="bg-bg-dark rounded-lg p-2 md:p-3">
                    <p className="text-text-muted text-xs mb-1">Time</p>
                    <p className="text-base md:text-lg font-bold text-text-primary">{formatDuration(attempt.time_taken_seconds)}</p>
                  </div>
                  <div className="bg-bg-dark rounded-lg p-2 md:p-3">
                    <p className="text-text-muted text-xs mb-1">Pass Mark</p>
                    <p className="text-base md:text-lg font-bold text-text-primary">700</p>
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
                    onClick={() => setExpandedAttempt(expandedAttempt === attempt.id ? null : attempt.id)}
                    className="w-full px-4 py-2 bg-bg-dark hover:bg-bg-dark/70 text-aws-orange font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    {expandedAttempt === attempt.id ? '▼' : '▶'} View Details
                  </button>
                  
                  {expandedAttempt === attempt.id && (
                    <div className="mt-3 p-3 bg-bg-dark rounded-lg">
                      <p className="text-text-muted text-xs md:text-sm">
                        Question-by-question review will be available in a future update. This will show all 65 questions with your answers and explanations.
                      </p>
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
    </div>
  )
}
