import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Header } from '../components/Header'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { DOMAINS, DOMAIN_COLORS } from '../types'
import { formatDuration } from '../lib/scoring'

interface DomainProgress {
  domain_id: number
  mastery_percent: number
  questions_attempted: number
  questions_correct: number
}

interface RecentAttempt {
  id: string
  attempted_at: string
  score_percent: number
  scaled_score: number
  passed: boolean
  time_taken_seconds: number
}

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [domainProgress, setDomainProgress] = useState<DomainProgress[]>([])
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([])
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [passRate, setPassRate] = useState(0)

  useEffect(() => {
    loadDashboardData()
  }, [user])

  async function loadDashboardData() {
    try {
      const [progressRes, attemptsRes, statsRes] = await Promise.all([
        supabase
          .from('domain_progress')
          .select('*')
          .eq('user_id', user?.id),
        supabase
          .from('exam_attempts')
          .select('*')
          .eq('user_id', user?.id)
          .order('attempted_at', { ascending: false })
          .limit(5),
        supabase
          .from('exam_attempts')
          .select('passed')
          .eq('user_id', user?.id),
      ])

      if (progressRes.data) {
        setDomainProgress(progressRes.data)
      }

      if (attemptsRes.data) {
        setRecentAttempts(attemptsRes.data)
      }

      if (statsRes.data) {
        setTotalAttempts(statsRes.data.length)
        const passedCount = statsRes.data.filter(a => a.passed).length
        setPassRate(statsRes.data.length > 0 ? (passedCount / statsRes.data.length) * 100 : 0)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <LoadingSpinner text="Loading dashboard..." />
      </div>
    )
  }

  const overallMastery = domainProgress.length > 0
    ? domainProgress.reduce((sum, d) => sum + d.mastery_percent, 0) / domainProgress.length
    : 0

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      <Header showNav={true} />
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {!user && (
            <div className="mb-6 p-4 bg-warning/10 border border-warning rounded-lg">
              <p className="text-warning font-medium mb-2">⚠️ Guest Mode</p>
              <p className="text-text-muted text-sm">
                You're using guest mode. <button onClick={() => navigate('/login')} className="text-aws-orange hover:underline font-medium">Sign in</button> to save your progress and track your exam history.
              </p>
            </div>
          )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
          <div className="bg-bg-card rounded-lg p-4 md:p-6">
            <p className="text-text-muted text-xs md:text-sm mb-1 md:mb-2">Overall Mastery</p>
            <p className="text-2xl md:text-4xl font-bold text-aws-orange">{Math.round(overallMastery)}%</p>
          </div>
          <div className="bg-bg-card rounded-lg p-4 md:p-6">
            <p className="text-text-muted text-xs md:text-sm mb-1 md:mb-2">Total Attempts</p>
            <p className="text-2xl md:text-4xl font-bold text-text-primary">{totalAttempts}</p>
          </div>
          <div className="bg-bg-card rounded-lg p-4 md:p-6">
            <p className="text-text-muted text-xs md:text-sm mb-1 md:mb-2">Pass Rate</p>
            <p className="text-2xl md:text-4xl font-bold text-success">{Math.round(passRate)}%</p>
          </div>
          <div className="bg-bg-card rounded-lg p-4 md:p-6">
            <p className="text-text-muted text-xs md:text-sm mb-1 md:mb-2">Questions Bank</p>
            <p className="text-2xl md:text-4xl font-bold text-text-primary">588</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Access */}
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-text-primary mb-4">Quick Access</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <Link
                  to="/mock-exam"
                  className="bg-bg-card hover:bg-bg-card-hover p-4 md:p-6 rounded-lg border-2 border-transparent hover:border-aws-orange transition-all"
                >
                  <div className="text-3xl md:text-4xl mb-2">📝</div>
                  <h3 className="text-base md:text-lg font-semibold text-text-primary mb-1 md:mb-2">Mock Exam</h3>
                  <p className="text-text-muted text-xs md:text-sm">65 questions • 90 minutes</p>
                </Link>
                
                <Link
                  to="/domain-practice"
                  className="bg-bg-card hover:bg-bg-card-hover p-4 md:p-6 rounded-lg border-2 border-transparent hover:border-aws-orange transition-all"
                >
                  <div className="text-3xl md:text-4xl mb-2">🎯</div>
                  <h3 className="text-base md:text-lg font-semibold text-text-primary mb-1 md:mb-2">Domain Practice</h3>
                  <p className="text-text-muted text-xs md:text-sm">Practice by domain</p>
                </Link>
                
                <Link
                  to="/weak-spot"
                  className="bg-bg-card hover:bg-bg-card-hover p-4 md:p-6 rounded-lg border-2 border-transparent hover:border-aws-orange transition-all"
                >
                  <div className="text-3xl md:text-4xl mb-2">⚡</div>
                  <h3 className="text-base md:text-lg font-semibold text-text-primary mb-1 md:mb-2">Weak Spot Trainer</h3>
                  <p className="text-text-muted text-xs md:text-sm">Focus on mistakes</p>
                </Link>
                
                <Link
                  to="/scenarios"
                  className="bg-bg-card hover:bg-bg-card-hover p-4 md:p-6 rounded-lg border-2 border-transparent hover:border-aws-orange transition-all"
                >
                  <div className="text-3xl md:text-4xl mb-2">💡</div>
                  <h3 className="text-base md:text-lg font-semibold text-text-primary mb-1 md:mb-2">Scenario Practice</h3>
                  <p className="text-text-muted text-xs md:text-sm">Real-world scenarios</p>
                </Link>
              </div>
            </div>

            {/* Recent Attempts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-semibold text-text-primary">Recent Attempts</h2>
                <Link to="/history" className="text-aws-orange hover:text-aws-orange/80 text-xs md:text-sm font-medium">
                  View All →
                </Link>
              </div>
              
              {recentAttempts.length === 0 ? (
                <div className="bg-bg-card rounded-lg p-8 text-center">
                  <p className="text-text-muted">No exam attempts yet. Start with a mock exam!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAttempts.map(attempt => (
                    <div key={attempt.id} className="bg-bg-card rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${attempt.passed ? 'bg-success/20' : 'bg-danger/20'}`}>
                          <span className={`text-2xl ${attempt.passed ? 'text-success' : 'text-danger'}`}>
                            {attempt.passed ? '✓' : '✗'}
                          </span>
                        </div>
                        <div>
                          <p className="text-text-primary font-medium">
                            {attempt.passed ? 'Passed' : 'Failed'} • {attempt.scaled_score}/1000
                          </p>
                          <p className="text-text-muted text-sm">
                            {new Date(attempt.attempted_at).toLocaleDateString()} • {formatDuration(attempt.time_taken_seconds)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-text-primary">{Math.round(attempt.score_percent)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Domain Mastery */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-text-primary mb-4">Domain Mastery</h2>
            <div className="space-y-3 md:space-y-6">
              {[1, 2, 3, 4].map(domainId => {
                const progress = domainProgress.find(d => d.domain_id === domainId)
                const mastery = progress?.mastery_percent || 0
                
                return (
                  <div key={domainId} className="bg-bg-card rounded-lg p-4 md:p-6">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="text-sm md:text-lg font-semibold text-text-primary mb-1 truncate">
                          {DOMAINS[domainId as keyof typeof DOMAINS]}
                        </h3>
                        <p className="text-text-muted text-xs md:text-sm">
                          {progress?.questions_attempted || 0} attempted
                        </p>
                      </div>
                      <div 
                        className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-base md:text-xl font-bold flex-shrink-0"
                        style={{ 
                          backgroundColor: DOMAIN_COLORS[domainId as keyof typeof DOMAIN_COLORS] + '20',
                          color: DOMAIN_COLORS[domainId as keyof typeof DOMAIN_COLORS]
                        }}
                      >
                        {Math.round(mastery)}%
                      </div>
                    </div>
                    <div className="w-full h-2 bg-bg-dark rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500"
                        style={{ 
                          width: `${mastery}%`,
                          backgroundColor: DOMAIN_COLORS[domainId as keyof typeof DOMAIN_COLORS]
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
