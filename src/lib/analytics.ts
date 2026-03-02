/**
 * Google Analytics 4 (GA4) tracking utilities.
 *
 * The gtag function is injected into window via index.html using the
 * VITE_GA_MEASUREMENT_ID environment variable. If the env var is missing
 * (e.g. local dev without a .env entry), all calls are silently no-ops.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function gtag(...args: unknown[]): void {
  if (typeof window.gtag === 'function') {
    window.gtag(...args)
  }
}

/** Fire a virtual page view. Call on every route change. */
export function trackPageView(path: string): void {
  gtag('event', 'page_view', { page_path: path })
}

/** Fire a named GA4 event with optional parameters. */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  gtag('event', name, params)
}
