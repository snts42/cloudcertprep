import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Question } from '../types'
import { fisherYatesShuffle } from '../lib/utils'

interface MasteryRow {
  question_id: string
  correct_streak: number
  last_was_wrong: boolean
  last_seen_at: string
  is_mastered: boolean
  in_exclusion_window: boolean
  weight: number | null
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
) {
  const [masteryMap, setMasteryMap] = useState<Map<string, MasteryRow>>(new Map())

  useEffect(() => {
    if (!userId || !domainId) {
      setMasteryMap(new Map())
      return
    }

    let cancelled = false

    async function fetchMastery() {
      try {
        const { data, error: fetchError } = await supabase
          .from('question_mastery')
          .select('question_id, correct_streak, last_was_wrong, last_seen_at, is_mastered, in_exclusion_window, weight')
          .eq('user_id', userId)
          .eq('domain_id', domainId)

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
          console.error('Failed to load mastery data:', err)
        }
      }
    }

    fetchMastery()
    return () => { cancelled = true }
  }, [userId, domainId])

  function selectQuestions(allDomainQuestions: Question[], count: number): Question[] {
    // Guest: random shuffle
    if (!userId) {
      return fisherYatesShuffle(allDomainQuestions).slice(0, count)
    }

    const activePool: Array<{ question: Question; weight: number }> = []
    const backfillPool: Array<{ question: Question; lastSeenAt: string }> = []

    for (const question of allDomainQuestions) {
      const row = masteryMap.get(question.id)

      if (!row) {
        // Never seen — weight 5
        activePool.push({ question, weight: 5 })
        continue
      }

      if (row.weight === null) {
        // Excluded (mastered + in exclusion window) — goes to backfill
        backfillPool.push({ question, lastSeenAt: row.last_seen_at })
        continue
      }

      activePool.push({ question, weight: row.weight })
    }

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

  return { selectQuestions }
}
