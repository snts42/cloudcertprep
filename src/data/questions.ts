import type { Question } from '../types'

type DomainLoader = () => Promise<unknown>

/**
 * Static import map for each certification's domain files.
 * Vite requires static strings for dynamic imports to chunk correctly.
 * To add a cert: add an entry here and in certifications.ts.
 */
const CERT_LOADERS: Record<string, Record<number, DomainLoader>> = {
  'clf-c02': {
    1: () => import('./clf-c02/domain1.json'),
    2: () => import('./clf-c02/domain2.json'),
    3: () => import('./clf-c02/domain3.json'),
    4: () => import('./clf-c02/domain4.json'),
  },
  'saa-c03': {
    1: () => import('./saa-c03/domain1.json'),
    2: () => import('./saa-c03/domain2.json'),
    3: () => import('./saa-c03/domain3.json'),
    4: () => import('./saa-c03/domain4.json'),
  },
}

/**
 * Load questions for a single domain of a specific certification.
 * Each domain is a separate chunk — only the requested domain is downloaded.
 */
export async function loadDomainQuestions(certCode: string, domainId: number): Promise<Question[]> {
  const certLoaders = CERT_LOADERS[certCode]
  if (!certLoaders) {
    throw new Error(`Unknown certification: ${certCode}`)
  }
  const loader = certLoaders[domainId]
  if (!loader) {
    throw new Error(`Invalid domain ID ${domainId} for certification ${certCode}`)
  }
  const mod = await loader() as { default: Question[] }
  return mod.default
}

/**
 * Load ALL questions from every domain of a certification in parallel.
 * Used by MockExam which needs the full question bank.
 */
export async function loadAllQuestions(certCode: string): Promise<Question[]> {
  const certLoaders = CERT_LOADERS[certCode]
  if (!certLoaders) {
    throw new Error(`Unknown certification: ${certCode}`)
  }
  const domainIds = Object.keys(certLoaders).map(Number)
  const results = await Promise.all(domainIds.map(id => loadDomainQuestions(certCode, id)))
  return results.flat()
}
