import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { formatRelativeDate } from '../lib/formatting'
import { formatTime, formatTotalTime } from '../lib/scoring'
import { usePageTitle } from '../hooks/usePageTitle'
import { Trophy } from 'lucide-react'

interface PlatformStats {
  total_users: number
  total_questions_answered: number
  total_exams_attempted: number
  total_exams_passed: number
}

interface RecentWin {
  passed_at: string
  scaled_score: number
}

export function Stats() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [recentWins, setRecentWins] = useState<RecentWin[]>([])
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number>(0)
  const [passesThisMonth, setPassesThisMonth] = useState<number>(0)
  const [fastestPassSeconds, setFastestPassSeconds] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  usePageTitle('Platform Stats | CloudCertPrep')

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
        console.error('Error loading platform stats:', statsError)
      }

      if (statsData) {
        setStats(statsData)
      }

      // Load aggregate exam stats via SECURITY DEFINER RPC
      // (works for both logged-in and anonymous users without exposing exam_attempts rows)
      const { data: examStats, error: examStatsError } = await supabase
        .rpc('get_public_exam_stats')

      if (examStatsError) {
        console.error('Error loading exam stats:', examStatsError)
      }

      if (examStats) {
        setPassesThisMonth(examStats.passes_this_month ?? 0)
        setFastestPassSeconds(examStats.fastest_pass_seconds)
        setTotalTimeMinutes(Math.round((examStats.total_exam_time_seconds ?? 0) / 60))
        setRecentWins(examStats.recent_wins ?? [])
      }

    } catch (err) {
      console.error('Error loading stats:', err)
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const passRate = stats && stats.total_exams_attempted > 0 
    ? Math.round((stats.total_exams_passed / stats.total_exams_attempted) * 100)
    : 0

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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary">Platform Statistics</h1>

          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {/* Hero Stat */}
          <div className="bg-bg-card rounded-lg p-6 md:p-8 shadow-card">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-success" />
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-bold text-text-primary">
                  {(stats?.total_exams_passed ?? 0).toLocaleString()}
                </p>
                <p className="text-text-muted text-sm">Exams Passed</p>
              </div>
            </div>

            {/* Supporting Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-text-muted/10">
              <div>
                <p className="text-xl md:text-2xl font-bold text-text-primary">{passRate}%</p>
                <p className="text-text-muted text-xs">Pass Rate</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-text-primary">{passesThisMonth}</p>
                <p className="text-text-muted text-xs">Passes This Month</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-text-primary">
                  {fastestPassSeconds ? formatTime(fastestPassSeconds) : '—'}
                </p>
                <p className="text-text-muted text-xs">Fastest Pass</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-text-primary">
                  {formatTotalTime(totalTimeMinutes)}
                </p>
                <p className="text-text-muted text-xs">Total Time in Exams</p>
              </div>
            </div>
          </div>

          {/* Community Stats */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-bg-card rounded-lg p-4 md:p-6 shadow-card">
              <p className="text-2xl md:text-3xl font-bold text-text-primary">
                {(stats?.total_users ?? 0).toLocaleString()}
              </p>
              <p className="text-text-muted text-xs md:text-sm mt-1">Users Registered</p>
            </div>
            <div className="bg-bg-card rounded-lg p-4 md:p-6 shadow-card">
              <p className="text-2xl md:text-3xl font-bold text-text-primary">
                {(stats?.total_questions_answered ?? 0).toLocaleString()}
              </p>
              <p className="text-text-muted text-xs md:text-sm mt-1">Questions Answered</p>
            </div>
          </div>

          {/* Recent Wins */}
          {recentWins.length > 0 && (
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">Recent Wins</h2>
              <div className="space-y-2">
                {recentWins.map((win, i) => (
                  <div
                    key={i}
                    className="bg-bg-card rounded-lg p-4 flex items-center justify-between shadow-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                        <span className="text-success text-lg">✓</span>
                      </div>
                      <div>
                        <p className="text-text-primary font-medium text-sm md:text-base">Someone passed!</p>
                        <p className="text-text-muted text-xs md:text-sm">{formatRelativeDate(win.passed_at)}</p>
                      </div>
                    </div>
                    <p className="text-success font-bold text-sm md:text-base">{win.scaled_score}/1000</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!stats && !error && (
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
