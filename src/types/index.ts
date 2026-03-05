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

/** AWS orange used for all domain colors */
export const DOMAIN_COLOR = '#FF9900'
