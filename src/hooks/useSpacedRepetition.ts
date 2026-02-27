import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Question } from '../types'

interface MasteryRow {
  question_id: string
  correct_streak: number
  last_was_wrong: boolean
  last_seen_at: string
  is_mastered: boolean
  in_exclusion_window: boolean
  weight: number | null
}

export interface MasteryStats {
  newCount: number
  learningCount: number
  strugglingCount: number
  masteredCount: number
}

interface UseSpacedRepetitionResult {
  loading: boolean
  error: string | null
  masteryStats: MasteryStats | null
  selectQuestions: (
    allDomainQuestions: Question[],
    count: number
  ) => Question[]
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function weightedDraw(pool: Array<{ question: Question; weight: number }>, count: number): Question[] {
  const results: Question[] = []
  const remaining = [...pool]

  while (results.length < count && remaining.length > 0) {
    const totalWeight = remaining.reduce((sum, item) => sum + item.weight, 0)
    let rand = Math.random() * totalWeight

    for (let i = 0; i < remaining.length; i++) {
      rand -= remaining[i].weight
      if (rand <= 0) {
        results.push(remaining[i].question)
        remaining.splice(i, 1)
        break
      }
    }
  }

  return results
}

export function useSpacedRepetition(
  userId: string | null,
  domainId: number | null
): UseSpacedRepetitionResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [masteryMap, setMasteryMap] = useState<Map<string, MasteryRow>>(new Map())
  const [masteryStats, setMasteryStats] = useState<MasteryStats | null>(null)

  useEffect(() => {
    if (!userId || !domainId) {
      setMasteryMap(new Map())
      setMasteryStats(null)
      return
    }

    let cancelled = false

    async function fetchMastery() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('question_mastery')
          .select('question_id, correct_streak, last_was_wrong, last_seen_at, is_mastered, in_exclusion_window, weight')
          .eq('user_id', userId)

        if (fetchError) throw fetchError
        if (cancelled) return

        const map = new Map<string, MasteryRow>()
        if (data) {
          for (const row of data as MasteryRow[]) {
            map.set(row.question_id, row)
          }
        }
        setMasteryMap(map)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load mastery data')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchMastery()
    return () => { cancelled = true }
  }, [userId, domainId])

  // Calculate stats whenever masteryMap or domainId changes
  // Stats are computed in selectQuestions context, but we also expose them
  // They get populated after selectQuestions is called with the domain questions

  function selectQuestions(allDomainQuestions: Question[], count: number): Question[] {
    // Guest: random shuffle
    if (!userId) {
      return fisherYatesShuffle(allDomainQuestions).slice(0, count)
    }

    const activePool: Array<{ question: Question; weight: number }> = []
    const backfillPool: Array<{ question: Question; lastSeenAt: string }> = []

    let newCount = 0
    let learningCount = 0
    let strugglingCount = 0
    let masteredCount = 0

    for (const question of allDomainQuestions) {
      const row = masteryMap.get(question.id)

      if (!row) {
        // Never seen — weight 5
        activePool.push({ question, weight: 5 })
        newCount++
        continue
      }

      if (row.is_mastered) {
        masteredCount++
      }

      if (row.weight === null) {
        // Excluded (mastered + in exclusion window) — goes to backfill
        backfillPool.push({ question, lastSeenAt: row.last_seen_at })
        continue
      }

      if (row.last_was_wrong) {
        strugglingCount++
      } else if (row.correct_streak >= 1 && row.correct_streak < 3) {
        learningCount++
      }

      activePool.push({ question, weight: row.weight })
    }

    setMasteryStats({ newCount, learningCount, strugglingCount, masteredCount })

    // Weighted draw from active pool
    let selected = weightedDraw(activePool, count)

    // Backfill if not enough
    if (selected.length < count) {
      const sortedBackfill = backfillPool.sort(
        (a, b) => new Date(a.lastSeenAt).getTime() - new Date(b.lastSeenAt).getTime()
      )
      const needed = count - selected.length
      const backfillQuestions = sortedBackfill.slice(0, needed).map(b => b.question)
      selected = [...selected, ...backfillQuestions]
    }

    // Final shuffle so backfill questions aren't always last
    return fisherYatesShuffle(selected)
  }

  return { loading, error, masteryStats, selectQuestions }
}
