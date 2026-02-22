import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Header } from '../components/Header'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { DOMAINS, DOMAIN_COLORS } from '../types'
import { formatDuration } from '../lib/scoring'

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
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all')

  useEffect(() => {
    loadHistory()
  }, [user])

  async function loadHistory() {
    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('user_id', user?.id)
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

  const totalAttempts = attempts.length
  const passedAttempts = attempts.filter(a => a.passed).length
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0
  const bestScore = attempts.length > 0
    ? Math.max(...attempts.map(a => a.scaled_score))
    : 0
  const averageScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.scaled_score, 0) / attempts.length)
    : 0

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      <Header showNav={true} />
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-text-primary mb-8">Exam History</h1>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-bg-card rounded-lg p-4 md:p-6">
            <p className="text-text-muted text-xs md:text-sm mb-2">Total Attempts</p>
            <p className="text-2xl md:text-4xl font-bold text-text-primary">{totalAttempts}</p>
          </div>
          <div className="bg-bg-card rounded-lg p-4 md:p-6">
            <p className="text-text-muted text-xs md:text-sm mb-2">Pass Rate</p>
            <p className="text-2xl md:text-4xl font-bold text-success">{passRate}%</p>
          </div>
          <div className="bg-bg-card rounded-lg p-4 md:p-6">
            <p className="text-text-muted text-xs md:text-sm mb-2">Best Score</p>
            <p className="text-2xl md:text-4xl font-bold text-aws-orange">{bestScore}</p>
          </div>
          <div className="bg-bg-card rounded-lg p-4 md:p-6">
            <p className="text-text-muted text-xs md:text-sm mb-2">Average Score</p>
            <p className="text-2xl md:text-4xl font-bold text-text-primary">{averageScore}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
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
          <div className="space-y-4">
            {filteredAttempts.map(attempt => (
              <div key={attempt.id} className="bg-bg-card rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${attempt.passed ? 'bg-success/20' : 'bg-danger/20'}`}>
                      <span className={`text-3xl ${attempt.passed ? 'text-success' : 'text-danger'}`}>
                        {attempt.passed ? '✓' : '✗'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-1">
                        {attempt.passed ? 'Passed' : 'Failed'}
                      </h3>
                      <p className="text-text-muted text-sm">
                        {new Date(attempt.attempted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-text-primary mb-1">{attempt.scaled_score}</p>
                    <p className="text-text-muted text-sm">/ 1000</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-bg-dark rounded-lg p-3">
                    <p className="text-text-muted text-xs mb-1">Score</p>
                    <p className="text-xl font-bold text-text-primary">{Math.round(attempt.score_percent)}%</p>
                  </div>
                  <div className="bg-bg-dark rounded-lg p-3">
                    <p className="text-text-muted text-xs mb-1">Correct</p>
                    <p className="text-xl font-bold text-text-primary">{attempt.correct_answers}/{attempt.total_questions}</p>
                  </div>
                  <div className="bg-bg-dark rounded-lg p-3">
                    <p className="text-text-muted text-xs mb-1">Time</p>
                    <p className="text-xl font-bold text-text-primary">{formatDuration(attempt.time_taken_seconds)}</p>
                  </div>
                  <div className="bg-bg-dark rounded-lg p-3">
                    <p className="text-text-muted text-xs mb-1">Pass Mark</p>
                    <p className="text-xl font-bold text-text-primary">700</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-text-primary mb-3">Domain Breakdown</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(domainId => {
                      const score = attempt[`domain_${domainId}_score` as keyof ExamAttempt] as number
                      return (
                        <div key={domainId} className="flex items-center justify-between">
                          <span className="text-text-muted text-sm">
                            {DOMAINS[domainId as keyof typeof DOMAINS]}
                          </span>
                          <span 
                            className="text-lg font-bold"
                            style={{ color: DOMAIN_COLORS[domainId as keyof typeof DOMAIN_COLORS] }}
                          >
                            {score}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
