/**
 * Centralized error logging.
 * - Development: Logs to console for debugging
 * - Production: Silent (add Sentry/LogRocket here when ready)
 */
export function logError(context: string, err: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, err)
  }
  
  // Future production monitoring:
  // if (import.meta.env.PROD && window.Sentry) {
  //   Sentry.captureException(err, { tags: { context } })
  // }
}
