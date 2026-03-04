import { supabase } from './supabase'
import { calculateDomainMastery } from './domainStats'

/**
 * Update domain progress for a single domain based on unique questions attempted/correct.
 * Queries all attempt_questions for the user+domain, deduplicates by question_id,
 * calculates mastery, and upserts to domain_progress.
 */
export async function updateDomainProgress(
  userId: string,
  domainId: number
): Promise<void> {
  // Single query - fetch both question_id and is_correct
  const { data: allQuestions } = await supabase
    .from('attempt_questions')
    .select('question_id, is_correct')
    .eq('user_id', userId)
    .eq('domain_id', domainId)

  // Deduplicate in one pass
  const uniqueQuestionIds = new Set(allQuestions?.map(q => q.question_id) || [])
  const totalUniqueAttempted = uniqueQuestionIds.size

  const uniqueCorrectIds = new Set(
    allQuestions?.filter(q => q.is_correct).map(q => q.question_id) || []
  )
  const totalUniqueCorrect = uniqueCorrectIds.size

  const newMastery = calculateDomainMastery(totalUniqueCorrect, domainId as 1 | 2 | 3 | 4)

  const { error: progressError } = await supabase.from('domain_progress').upsert({
    user_id: userId,
    domain_id: domainId,
    questions_attempted: totalUniqueAttempted,
    questions_correct: totalUniqueCorrect,
    mastery_percent: newMastery,
  }, {
    onConflict: 'user_id,domain_id',
  })

  if (progressError) {
    console.error(`Error updating domain ${domainId} progress:`, progressError)
  }
}
