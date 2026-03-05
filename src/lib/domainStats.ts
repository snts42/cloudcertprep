import { getCertDomainCounts } from '../data/certifications'

/**
 * Calculate domain mastery as coverage percentage based on correct answers.
 * Mastery = (questionsCorrect / totalQuestionsInDomain) * 100
 */
export function calculateDomainMastery(
  questionsCorrect: number,
  domainId: number,
  certCode: string = 'clf-c02'
): number {
  const counts = getCertDomainCounts(certCode)
  const total = counts[domainId]
  if (!total) return 0
  return Math.round((questionsCorrect / total) * 100)
}
