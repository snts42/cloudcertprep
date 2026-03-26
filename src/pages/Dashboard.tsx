import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCert, setActiveCert } from '../hooks/useCert'
import { usePageTitle } from '../hooks/usePageTitle'
import { Header } from '../components/Header'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { formatRelativeDate } from '../lib/formatting'
import { DOMAIN_COLOR } from '../types'
import type { DomainProgress } from '../types'
import { formatDuration } from '../lib/scoring'
import { CERTIFICATION_LIST, getCertTotalQuestions } from '../data/certifications'
import { FileText, Target, BookOpen, TrendingUp, Lock, BarChart3 } from 'lucide-react'
import { logError } from '../lib/logger'
import { DEFAULT_PAGE_TITLE } from '../lib/constants'

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
  const { user, loading: authLoading } = useAuth()
  const cert = useCert()

  const pageTitle = user
    ? `${cert.shortName} Practice | CloudCertPrep`
    : DEFAULT_PAGE_TITLE
  usePageTitle(pageTitle)

  const [domainProgress, setDomainProgress] = useState<DomainProgress[]>([])
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([])

  async function loadDashboardData() {
    try {
      const [progressRes, attemptsRes] = await Promise.all([
        supabase
          .from('domain_progress')
          .select('*')
          .eq('user_id', user!.id)
          .eq('cert_code', cert.code),
        supabase
          .from('exam_attempts')
          .select('*')
          .eq('user_id', user!.id)
          .eq('cert_code', cert.code)
          .order('attempted_at', { ascending: false })
          .limit(5),
      ])

      if (progressRes.error) {
        logError('Dashboard.loadDashboardData.progress', progressRes.error)
      }
      if (attemptsRes.error) {
        logError('Dashboard.loadDashboardData.attempts', attemptsRes.error)
      }

      if (progressRes.data) {
        setDomainProgress(progressRes.data)
      }

      if (attemptsRes.data) {
        setRecentAttempts(attemptsRes.data)
      }
    } catch (error: unknown) {
      logError('Dashboard.loadDashboardData', error)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadDashboardData()
    }
  }, [user, authLoading, cert.code])

  if (authLoading) {
    return (
      <div className="bg-bg-dark flex flex-col">
        <Header showNav={true} />
        <div className="flex-1 flex items-center justify-center p-8">
          <LoadingSpinner text="Loading..." />
        </div>
      </div>
    )
  }

  // No cert param = landing page with cert selector
  const examMinutes = Math.round(cert.examTimeSeconds / 60)

  return (
    <div className="bg-bg-dark flex flex-col">
      <Header showNav={true} />
      <div className="p-4 md:p-8">
        <div className={user ? "max-w-7xl mx-auto" : "max-w-4xl mx-auto"}>
        <div className={user ? "grid grid-cols-1 lg:grid-cols-3 gap-8" : ""}>
          <div className={user ? "lg:col-span-2 space-y-8" : "space-y-8"}>
            {/* Cert Toggle */}
            <div>
              <div className="flex items-center gap-2">
                {CERTIFICATION_LIST.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setActiveCert(c.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                      cert.code === c.code
                        ? 'bg-aws-orange text-white'
                        : c.status === 'coming-soon'
                        ? 'bg-bg-card text-text-muted/50 cursor-not-allowed'
                        : 'bg-bg-card text-text-muted hover:text-text-primary'
                    }`}
                    disabled={c.status === 'coming-soon'}
                    title={c.status === 'coming-soon' ? 'Coming soon' : c.name}
                  >
                    {c.shortName}
                    {c.status === 'coming-soon' && <span className="ml-1 text-[10px]">(soon)</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Practice Modes */}
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-text-primary mb-4">
                {user ? `${cert.shortName} Practice Modes` : `Free ${cert.shortName} Practice Exams`}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <Link
                  to="/practice-exam"
                  className="bg-bg-card hover:bg-bg-card-hover p-4 md:p-6 rounded-lg border-2 border-transparent hover:border-aws-orange transition-all"
                >
                  <FileText className="w-8 h-8 md:w-10 md:h-10 text-aws-orange mb-2" />
                  <h3 className="text-base md:text-lg font-semibold text-text-primary mb-1 md:mb-2">Practice Exam</h3>
                  <p className="text-text-muted text-xs md:text-sm">{cert.examQuestionCount} questions • {examMinutes} minutes • Pass at {cert.passingScore}/1000</p>
                </Link>
                
                <Link
                  to="/domain-practice"
                  className="bg-bg-card hover:bg-bg-card-hover p-4 md:p-6 rounded-lg border-2 border-transparent hover:border-aws-orange transition-all"
                >
                  <Target className="w-8 h-8 md:w-10 md:h-10 text-aws-orange mb-2" />
                  <h3 className="text-base md:text-lg font-semibold text-text-primary mb-1 md:mb-2">Domain Practice</h3>
                  <p className="text-text-muted text-xs md:text-sm">Practice by domain • Instant feedback</p>
                </Link>
              </div>
            </div>

            {/* Recent Attempts */}
            {user && (
              <div className="hidden lg:block">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl md:text-2xl font-semibold text-text-primary">Recent Attempts</h2>
                  <Link to="/history" className="text-aws-orange hover:text-aws-orange/80 text-xs md:text-sm font-medium">
                    View All →
                  </Link>
                </div>
                
                {recentAttempts.length === 0 ? (
                  <div className="bg-bg-card rounded-lg p-8 text-center shadow-card">
                    <p className="text-text-muted">No exam attempts yet. Start with a practice exam!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentAttempts.map(attempt => (
                      <div key={attempt.id} className="bg-bg-card rounded-lg p-4 flex items-center justify-between shadow-card">
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
                              {formatRelativeDate(attempt.attempted_at)} • {formatDuration(attempt.time_taken_seconds)}
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
            )}

            {/* Guest welcome */}
            {!user && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold text-text-primary mb-4">About {cert.shortName}</h2>
                  <div className="bg-bg-card rounded-lg p-4 md:p-6 shadow-card">
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-start gap-3">
                        <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-aws-orange flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-text-primary font-medium text-sm md:text-base">{getCertTotalQuestions(cert.code).toLocaleString()} Practice Questions</p>
                          <p className="text-text-muted text-xs md:text-sm">Up to date with the 2026 exam guide - more questions than most paid platforms</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 md:w-6 md:h-6 text-aws-orange flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-text-primary font-medium text-sm md:text-base">Full-Length Practice Exams</p>
                          <p className="text-text-muted text-xs md:text-sm">Over 10¹⁰⁰ possible combinations - you won't see the same exam twice</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Target className="w-5 h-5 md:w-6 md:h-6 text-aws-orange flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-text-primary font-medium text-sm md:text-base">{cert.domains.length} Exam Domains</p>
                          <p className="text-text-muted text-xs md:text-sm">Practice each domain individually with instant feedback and detailed explanations</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-aws-orange flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-text-primary font-medium text-sm md:text-base">Progress Tracking</p>
                          <p className="text-text-muted text-xs md:text-sm">Monitor your scores across all domains and review your exam history</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 p-3 md:p-4 bg-aws-orange/10 border border-aws-orange rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-4 h-4 md:w-5 md:h-5 text-aws-orange" />
                        <p className="text-aws-orange font-medium text-sm md:text-base">Unlock All Features</p>
                      </div>
                      <p className="text-text-muted text-xs md:text-sm mb-3">
                        Sign in to save your progress, track exam history, and monitor your domain mastery over time.
                      </p>
                      <button 
                        onClick={() => navigate('/login')}
                        className="w-full bg-aws-orange hover:bg-aws-orange/90 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm md:text-base"
                      >
                        Sign In / Create Account
                      </button>
                    </div>
                  </div>
                </div>

                <Link
                  to="/stats"
                  className="block bg-gradient-to-r from-aws-orange/10 to-aws-orange/5 hover:from-aws-orange/15 hover:to-aws-orange/10 border border-aws-orange/20 hover:border-aws-orange/40 rounded-lg p-4 md:p-5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-aws-orange/20 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-aws-orange" />
                    </div>
                    <div>
                      <p className="text-text-primary font-semibold text-sm md:text-base">Community Statistics</p>
                      <p className="text-text-muted text-xs md:text-sm">Exams passed, pass rates, and recent wins</p>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Right Column - Domain Mastery */}
          {user && (
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-text-primary mb-4">Domain Mastery</h2>
              
              <div className="space-y-3 md:space-y-6">
                {cert.domains.map(domain => {
                  const progress = domainProgress.find(d => d.domain_id === domain.id)
                  const mastery = progress?.mastery_percent || 0
                  
                  return (
                    <div key={domain.id} className="bg-bg-card rounded-lg p-4 md:p-6 shadow-card">
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="flex-1 min-w-0 pr-3">
                          <h3 className="text-sm md:text-lg font-semibold text-text-primary mb-1 truncate">
                            {domain.name}
                          </h3>
                          <p className="text-text-muted text-xs md:text-sm">
                            {progress?.questions_attempted || 0}/{domain.questionCount} attempted • {progress?.questions_correct || 0} correct
                          </p>
                        </div>
                        <div 
                          className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-base md:text-xl font-bold flex-shrink-0"
                          style={{ 
                            backgroundColor: DOMAIN_COLOR + '20',
                            color: DOMAIN_COLOR
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
                            backgroundColor: DOMAIN_COLOR
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}