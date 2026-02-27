export interface Question {
  id: string
  domainId: 1 | 2 | 3 | 4
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
    E?: string
  }
  answer: string | string[]
  explanation: string
  source: string
  isMultiAnswer: boolean
}

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

export interface AttemptQuestion {
  id: string
  attempt_id: string
  question_id: string
  user_answer: string | null
  correct_answer: string
  is_correct: boolean
  was_flagged: boolean
  domain_id: number
}

export interface DomainProgress {
  domain_id: number
  domain_name: string
  questions_attempted: number
  questions_correct: number
  mastery_percent: number
}

export const DOMAINS = {
  1: 'Cloud Concepts',
  2: 'Security & Compliance',
  3: 'Cloud Technology & Services',
  4: 'Billing, Pricing & Support',
} as const

export const DOMAIN_COLORS = {
  1: '#FF9900', // AWS Orange
  2: '#FF9900', // AWS Orange
  3: '#FF9900', // AWS Orange
  4: '#FF9900', // AWS Orange
} as const
