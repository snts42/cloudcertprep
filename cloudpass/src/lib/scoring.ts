import type { Question } from '../types'

/**
 * Calculate AWS scaled score (100-1000 range)
 * AWS uses a scaled scoring system where:
 * - Minimum score: 100
 * - Maximum score: 1000
 * - Passing score: 700
 */
export function calculateScaledScore(correct: number, total: number): number {
  const rawPercent = correct / total
  const scaled = Math.round(100 + rawPercent * 900)
  return Math.min(1000, Math.max(100, scaled))
}

/**
 * Determine if the exam was passed
 * AWS CLF-C02 passing score is 700/1000
 */
export function isPassed(scaledScore: number): boolean {
  return scaledScore >= 700
}

/**
 * Calculate score for a specific domain
 */
export function getDomainScore(
  results: { domainId: number; isCorrect: boolean }[],
  domainId: number
): number {
  const domainQs = results.filter(q => q.domainId === domainId)
  if (domainQs.length === 0) return 0
  const correct = domainQs.filter(q => q.isCorrect).length
  return Math.round((correct / domainQs.length) * 100)
}

/**
 * Select 65 questions for mock exam with correct domain proportions
 * AWS CLF-C02 domain breakdown:
 * - Domain 1 (Cloud Concepts): 24% = ~16 questions
 * - Domain 2 (Security & Compliance): 30% = ~20 questions
 * - Domain 3 (Cloud Technology & Services): 34% = ~22 questions
 * - Domain 4 (Billing, Pricing & Support): 12% = ~8 questions
 * Total: 65 questions (with rounding adjustments)
 */
export function selectExamQuestions(allQuestions: Question[]): Question[] {
  // Target distribution based on AWS exam blueprint
  const targets: Record<number, number> = {
    1: 16, // Cloud Concepts (24%)
    2: 20, // Security & Compliance (30%)
    3: 22, // Cloud Technology & Services (34%)
    4: 7,  // Billing, Pricing & Support (12%) - adjusted to total 65
  }

  const selected: Question[] = []

  // Select questions from each domain
  for (const [domainId, count] of Object.entries(targets)) {
    const domainQs = allQuestions
      .filter(q => q.domainId === Number(domainId))
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, count)
    
    selected.push(...domainQs)
  }

  // Final shuffle to mix domains
  return selected.sort(() => Math.random() - 0.5)
}

/**
 * Format seconds into MM:SS format
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/**
 * Format seconds into human-readable duration
 * e.g., "45 minutes 30 seconds"
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes === 0) {
    return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`
  }
  
  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  
  return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`
}

/**
 * Check if an answer is correct for both single and multi-answer questions
 */
export function isAnswerCorrect(
  userAnswer: string | string[],
  correctAnswer: string | string[],
  isMultiAnswer: boolean
): boolean {
  if (isMultiAnswer) {
    // Multi-answer: both arrays must match (order doesn't matter)
    if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) {
      return false
    }
    
    if (userAnswer.length !== correctAnswer.length) {
      return false
    }
    
    const sortedUser = [...userAnswer].sort()
    const sortedCorrect = [...correctAnswer].sort()
    
    return sortedUser.every((ans, idx) => ans === sortedCorrect[idx])
  } else {
    // Single answer: simple string comparison
    return userAnswer === correctAnswer
  }
}
