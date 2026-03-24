import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ThemeProvider } from './hooks/useTheme'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { DonateButton } from './components/DonateButton'
import { LoadingSpinner } from './components/LoadingSpinner'
import { CookieConsent } from './components/CookieConsent'
import { ScrollToTop } from './components/ScrollToTop'
import { trackPageView } from './lib/analytics'

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })))
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })))
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const MockExam = lazy(() => import('./pages/MockExam').then(m => ({ default: m.MockExam })))
const DomainPractice = lazy(() => import('./pages/DomainPractice').then(m => ({ default: m.DomainPractice })))
const History = lazy(() => import('./pages/History').then(m => ({ default: m.History })))
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })))
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })))
const Stats = lazy(() => import('./pages/Stats').then(m => ({ default: m.Stats })))

function AppRoutes() {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])

  return (
    <Suspense
      key={location.pathname}
      fallback={
        <>
          <Header showNav={true} />
          <div className="flex-1 flex items-center justify-center p-8">
            <LoadingSpinner />
          </div>
        </>
      }
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/mock-exam" element={<MockExam />} />
        <Route path="/domain-practice" element={<DomainPractice />} />
        <Route path="/history" element={<History />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

function AppContent() {
  const location = useLocation()
  const hideFooter = location.pathname === '/mock-exam'

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <main className="flex-1">
        <AppRoutes />
      </main>
      {!hideFooter && <Footer />}
      <DonateButton />
      <CookieConsent />
    </div>
  )
}

export default App
