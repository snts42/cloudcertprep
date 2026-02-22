// Total questions per domain in master_questions.json
export const DOMAIN_QUESTION_COUNTS = {
  1: 99,   // Cloud Concepts
  2: 66,   // Security & Compliance
  3: 356,  // Cloud Technology & Services
  4: 67,   // Billing, Pricing & Support
} as const

/**
 * Calculate domain mastery as coverage percentage based on correct answers
 * Mastery = (questions_correct / total_questions_in_domain) * 100
 */
export function calculateDomainMastery(
  questionsCorrect: number,
  domainId: 1 | 2 | 3 | 4
): number {
  const totalQuestions = DOMAIN_QUESTION_COUNTS[domainId]
  return Math.round((questionsCorrect / totalQuestions) * 100)
}
