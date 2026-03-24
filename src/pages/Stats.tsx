import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { formatRelativeDate } from '../lib/formatting'
import { formatTime } from '../lib/scoring'
import { usePageTitle } from '../hooks/usePageTitle'
import { CERTIFICATIONS, getCertTotalQuestions } from '../data/certifications'
import { Trophy, TrendingUp, Clock } from 'lucide-react'
import { logError } from '../lib/logger'

interface PlatformStats {
  total_users: number
  total_questions_answered: number
  total_exams_attempted: number
  total_exams_passed: number
}

interface RecentWin {
  passed_at: string
  scaled_score: number
  cert_code?: string
  time_taken_seconds?: number
}

interface CertStats {
  cert_code: string
  total_attempts: number
  total_passes: number
  avg_score: number
  avg_time_minutes: number
  fastest_pass_seconds: number | null
  domain_stats: DomainStat[]
  recent_passes: RecentWin[]
}

interface DomainStat {
  domain_id: number
  domain_name: string
  avg_score: number
}

export function Stats() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [certStats, setCertStats] = useState<Record<string, CertStats>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  usePageTitle('Community Statistics | CloudCertPrep')

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      setLoading(true)
      setError(null)

      // Load platform stats from singleton table
      const { data: statsData, error: statsError } = await supabase
        .from('platform_stats')
        .select('*')
        .eq('id', 'singleton')
        .single()

      if (statsError && statsError.code !== 'PGRST116') {
        logError('Stats.loadStats.platformStats', statsError)
      }

      if (statsData) {
        setStats(statsData)
      }

      // Load aggregate exam stats via SECURITY DEFINER RPC
      // (works for both logged-in and anonymous users without exposing exam_attempts rows)
      const { data: examStats, error: examStatsError } = await supabase
        .rpc('get_public_exam_stats')

      if (examStatsError) {
        logError('Stats.loadStats.examStats', examStatsError)
      }

      if (examStats?.cert_stats) {
        const certStatsMap: Record<string, CertStats> = {}
        for (const cs of examStats.cert_stats) {
          certStatsMap[cs.cert_code] = cs
        }
        setCertStats(certStatsMap)
      }

    } catch (err: unknown) {
      logError('Stats.loadStats', err)
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const clfStats = certStats['clf-c02']

  if (loading) {
    return (
      <div className="bg-bg-dark flex flex-col">
        <Header showNav={true} />
        <div className="flex-1 flex items-center justify-center p-8">
          <LoadingSpinner text="Loading stats..." />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-dark flex flex-col">
      <Header showNav={true} />
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary">Community Progress</h1>

          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {/* CLF-C02 Section */}
          {clfStats && (
            <div className="bg-bg-card rounded-lg p-4 md:p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-success/20 text-success">ACTIVE</span>
                    <h2 className="text-lg md:text-xl font-semibold text-text-primary">{CERTIFICATIONS['clf-c02'].shortName}</h2>
                  </div>
                  <p className="text-text-muted text-xs md:text-sm">{CERTIFICATIONS['clf-c02'].name}</p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-text-primary">{clfStats.total_attempts.toLocaleString()}</p>
                  <p className="text-text-muted text-xs md:text-sm mt-1">Total Attempts</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-text-primary">{clfStats.total_passes.toLocaleString()}</p>
                  <p className="text-text-muted text-xs md:text-sm mt-1">Total Passes</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-text-primary">
                    {clfStats.total_attempts > 0 ? Math.round((clfStats.total_passes / clfStats.total_attempts) * 100) : 0}%
                  </p>
                  <p className="text-text-muted text-xs md:text-sm mt-1">Pass Rate</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-text-primary">{Math.round(clfStats.avg_score)}</p>
                  <p className="text-text-muted text-xs md:text-sm mt-1">Avg Score (Passed)</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-text-primary">{Math.round(clfStats.avg_time_minutes)} min</p>
                  <p className="text-text-muted text-xs md:text-sm mt-1">Avg Time (Passed)</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-text-primary">
                    {clfStats.fastest_pass_seconds ? formatTime(clfStats.fastest_pass_seconds) : '—'}
                  </p>
                  <p className="text-text-muted text-xs md:text-sm mt-1">Fastest Pass</p>
                </div>
              </div>

              {/* Domain Difficulty Ranking */}
              {clfStats.domain_stats && clfStats.domain_stats.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm md:text-base font-semibold text-text-primary mb-3">Domain Difficulty (Hardest First)</h3>
                  <div className="space-y-3">
                    {clfStats.domain_stats.map((ds, index) => (
                      <div key={ds.domain_id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-text-muted text-xs font-medium">#{index + 1}</span>
                            <p className="text-text-primary text-xs md:text-sm font-medium">{ds.domain_name}</p>
                          </div>
                          <p className="text-text-muted text-xs md:text-sm">{Math.round(ds.avg_score)}% avg</p>
                        </div>
                        <div className="h-2 bg-bg-dark rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all"
                            style={{ 
                              width: `${Math.min(100, ds.avg_score)}%`,
                              backgroundColor: ds.avg_score < 60 ? '#EF4444' : ds.avg_score < 75 ? '#F59E0B' : '#FF9900'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Passes */}
              {clfStats.recent_passes && clfStats.recent_passes.length > 0 && (
                <div>
                  <h3 className="text-sm md:text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-success" />
                    Recent Passes
                  </h3>
                  <div className="space-y-2">
                    {clfStats.recent_passes.map((pass, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-bg-dark rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                            <span className="text-success text-sm">✓</span>
                          </div>
                          <div>
                            <p className="text-text-primary font-bold text-sm md:text-base">{pass.scaled_score}/1000</p>
                            <div className="flex items-center gap-2 text-text-muted text-xs">
                              <span>{formatRelativeDate(pass.passed_at)}</span>
                              {pass.time_taken_seconds && (
                                <>
                                  <span>•</span>
                                  <Clock className="w-3 h-3 inline" />
                                  <span>{formatTime(pass.time_taken_seconds)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SAA-C03 Coming Soon Section */}
          <div className="bg-gradient-to-r from-aws-orange/10 to-aws-orange/5 border border-aws-orange/20 rounded-lg p-4 md:p-6 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-aws-orange/20 text-aws-orange">COMING SOON</span>
                  <h2 className="text-lg md:text-xl font-semibold text-text-primary">{CERTIFICATIONS['saa-c03'].shortName}</h2>
                </div>
                <p className="text-text-muted text-xs md:text-sm">{CERTIFICATIONS['saa-c03'].name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-aws-orange flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-text-primary text-sm md:text-base mb-1">
                  {getCertTotalQuestions('saa-c03').toLocaleString()} practice questions available
                </p>
                <p className="text-text-muted text-xs md:text-sm">
                  Full launch expected in 1-2 weeks. Community stats will appear here once users start taking exams.
                </p>
              </div>
            </div>
          </div>

          {/* Platform Totals */}
          {stats && (
            <div className="border-t border-text-muted/10 pt-6">
              <p className="text-text-muted text-xs md:text-sm text-center">
                {stats.total_users.toLocaleString()} users • {stats.total_questions_answered.toLocaleString()} questions answered across all certifications
              </p>
            </div>
          )}

          {/* Empty state */}
          {!clfStats && !error && (
            <div className="bg-bg-card rounded-lg p-8 text-center shadow-card">
              <p className="text-text-muted">
                Statistics will appear here as the community grows.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
