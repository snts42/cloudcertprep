import type { Question } from '../types'

/**
 * Dynamically load questions for a single domain.
 * Each domain is a separate chunk — only the requested domain is downloaded.
 */
export async function loadDomainQuestions(domainId: number): Promise<Question[]> {
  const loaders: Record<number, () => Promise<unknown>> = {
    1: () => import('./domain1.json'),
    2: () => import('./domain2.json'),
    3: () => import('./domain3.json'),
    4: () => import('./domain4.json'),
  }
  const mod = await loaders[domainId]() as { default: Question[] }
  return mod.default
}

/**
 * Load ALL questions from every domain in parallel.
 * Used by MockExam which needs the full question bank.
 */
export async function loadAllQuestions(): Promise<Question[]> {
  const [d1, d2, d3, d4] = await Promise.all([
    loadDomainQuestions(1),
    loadDomainQuestions(2),
    loadDomainQuestions(3),
    loadDomainQuestions(4),
  ])
  return [...d1, ...d2, ...d3, ...d4]
}
