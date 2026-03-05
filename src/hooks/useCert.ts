import { useSyncExternalStore } from 'react'
import { CERTIFICATIONS, DEFAULT_CERT_ID } from '../data/certifications'
import type { Certification } from '../data/certifications'

const STORAGE_KEY = 'activeCert'

/** Notify all useCert() consumers when the cert changes */
const listeners = new Set<() => void>()
function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CERT_ID
}

/**
 * Read the active certification from localStorage.
 * Always returns a valid Certification (falls back to CLF-C02).
 */
export function useCert(): Certification {
  const code = useSyncExternalStore(subscribe, getSnapshot)
  return CERTIFICATIONS[code] ?? CERTIFICATIONS[DEFAULT_CERT_ID]
}

/** Switch the active certification and notify all consumers */
export function setActiveCert(certCode: string): void {
  if (!CERTIFICATIONS[certCode]) return
  localStorage.setItem(STORAGE_KEY, certCode)
  listeners.forEach(cb => cb())
}
