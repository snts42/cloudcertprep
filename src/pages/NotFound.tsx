import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import { Header } from '../components/Header'
import { trackEvent } from '../lib/analytics'
import { CloudOff } from 'lucide-react'

export function NotFound() {
  const location = useLocation()
  usePageTitle('404 - Page Not Found | CloudCertPrep')

  useEffect(() => {
    trackEvent('page_not_found', { path: location.pathname })
  }, [location.pathname])

  return (
    <>
      <Header showNav={true} />
      
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="max-w-md w-full">
          <div className="bg-bg-card rounded-lg p-6 md:p-8 shadow-card text-center">
            <CloudOff className="w-16 h-16 md:w-20 md:h-20 text-aws-orange mx-auto mb-4" />
            
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
              404 - Page Not Found
            </h1>
            
            <p className="text-sm md:text-base text-text-muted mb-6">
              This page must have migrated to another region.
            </p>
            
            <Link
              to="/"
              className="inline-block w-full bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
