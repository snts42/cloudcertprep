/**
 * Certification registry. To add a new cert:
 * 1. Add config entry here
 * 2. Create question JSON files in src/data/<cert-code>/domain1.json etc.
 * 3. Register domain loaders in questions.ts
 */

export interface CertDomain {
  id: number
  name: string
  questionCount: number
  /** Proportion of the mock exam (0.24 = 24%) */
  examProportion: number
}

export interface Certification {
  code: string
  name: string
  shortName: string
  examQuestionCount: number
  examTimeSeconds: number
  passingScore: number
  domains: CertDomain[]
  status: 'active' | 'coming-soon'
}

export const CERTIFICATIONS: Record<string, Certification> = {
  'clf-c02': {
    code: 'clf-c02',
    name: 'AWS Cloud Practitioner',
    shortName: 'CLF-C02',
    examQuestionCount: 65,
    examTimeSeconds: 90 * 60,
    passingScore: 700,
    domains: [
      { id: 1, name: 'Cloud Concepts', questionCount: 143, examProportion: 0.24 },
      { id: 2, name: 'Security & Compliance', questionCount: 248, examProportion: 0.30 },
      { id: 3, name: 'Cloud Technology & Services', questionCount: 367, examProportion: 0.34 },
      { id: 4, name: 'Billing, Pricing & Support', questionCount: 224, examProportion: 0.12 },
    ],
    status: 'active',
  },
  'saa-c03': {
    code: 'saa-c03',
    name: 'AWS Solutions Architect Associate',
    shortName: 'SAA-C03',
    examQuestionCount: 65,
    examTimeSeconds: 130 * 60,
    passingScore: 720,
    domains: [
      { id: 1, name: 'Design Secure Architectures', questionCount: 5, examProportion: 0.30 },
      { id: 2, name: 'Design Resilient Architectures', questionCount: 5, examProportion: 0.26 },
      { id: 3, name: 'Design High-Performing Architectures', questionCount: 5, examProportion: 0.24 },
      { id: 4, name: 'Design Cost-Optimized Architectures', questionCount: 5, examProportion: 0.20 },
    ],
    status: 'coming-soon',
  },
}

export const DEFAULT_CERT_ID = 'clf-c02'

/** All cert codes in display order */
export const CERT_CODES = Object.keys(CERTIFICATIONS)

/** All certifications as an array */
export const CERTIFICATION_LIST = Object.values(CERTIFICATIONS)

/**
 * Get domain names for a certification, keyed by domain ID.
 * Drop-in replacement for the old DOMAINS constant.
 */
export function getCertDomains(certCode: string): Record<number, string> {
  const cert = CERTIFICATIONS[certCode]
  if (!cert) return {}
  return Object.fromEntries(cert.domains.map(d => [d.id, d.name]))
}

/**
 * Get domain question counts for a certification, keyed by domain ID.
 * Drop-in replacement for DOMAIN_QUESTION_COUNTS.
 */
export function getCertDomainCounts(certCode: string): Record<number, number> {
  const cert = CERTIFICATIONS[certCode]
  if (!cert) return {}
  return Object.fromEntries(cert.domains.map(d => [d.id, d.questionCount]))
}

/**
 * Get total question count across all domains.
 */
export function getCertTotalQuestions(certCode: string): number {
  const cert = CERTIFICATIONS[certCode]
  if (!cert) return 0
  return cert.domains.reduce((sum, d) => sum + d.questionCount, 0)
}
