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
  // Get count of UNIQUE questions attempted for this domain (across all attempts)
  const { data: uniqueQuestions } = await supabase
    .from('attempt_questions')
    .select('question_id')
    .eq('user_id', userId)
    .eq('domain_id', domainId)

  // Count distinct question IDs
  const uniqueQuestionIds = new Set(uniqueQuestions?.map(q => q.question_id) || [])
  const totalUniqueAttempted = uniqueQuestionIds.size

  // Get count of UNIQUE questions answered correctly for this domain
  const { data: correctQuestions } = await supabase
    .from('attempt_questions')
    .select('question_id')
    .eq('user_id', userId)
    .eq('domain_id', domainId)
    .eq('is_correct', true)

  const uniqueCorrectIds = new Set(correctQuestions?.map(q => q.question_id) || [])
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
