// Total questions per domain in master_questions.json
export const DOMAIN_QUESTION_COUNTS = {
  1: 196,  // Cloud Concepts
  2: 220,  // Security & Compliance
  3: 408,  // Cloud Technology & Services
  4: 230,  // Billing, Pricing & Support
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
