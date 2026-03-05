export interface Question {
  id: string
  domainId: DomainId
  question: string
  options: Record<OptionKey, string> & { E?: string }
  answer: string | string[]
  explanation: string
  source: string
  isMultiAnswer: boolean
}

export type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E'
export type DomainId = 1 | 2 | 3 | 4
export const DOMAIN_IDS = [1, 2, 3, 4] as const

export interface ExamAttempt {
  id: string
  user_id: string
  attempted_at: string
  score_percent: number
  scaled_score: number
  passed: boolean
  time_taken_seconds: number
  total_questions: number
  correct_answers: number
  domain_1_score: number
  domain_2_score: number
  domain_3_score: number
  domain_4_score: number
}

export interface DomainProgress {
  domain_id: number
  questions_attempted: number
  questions_correct: number
  mastery_percent: number
}

export const DOMAINS: Record<DomainId, string> = {
  1: 'Cloud Concepts',
  2: 'Security & Compliance',
  3: 'Cloud Technology & Services',
  4: 'Billing, Pricing & Support',
} as const

export const DOMAIN_COLORS: Record<DomainId, string> = {
  1: '#FF9900',
  2: '#FF9900',
  3: '#FF9900',
  4: '#FF9900',
} as const
