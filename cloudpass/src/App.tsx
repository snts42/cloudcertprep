import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { DonateButton } from './components/DonateButton'
import { LoadingSpinner } from './components/LoadingSpinner'

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })))
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })))
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const MockExam = lazy(() => import('./pages/MockExam').then(m => ({ default: m.MockExam })))
const DomainPractice = lazy(() => import('./pages/DomainPractice').then(m => ({ default: m.DomainPractice })))
const History = lazy(() => import('./pages/History').then(m => ({ default: m.History })))

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <Suspense fallback={<><Header showNav={true} /><div className="flex-1 flex items-center justify-center p-8"><LoadingSpinner /></div></>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/mock-exam" element={<MockExam />} />
              <Route path="/domain-practice" element={<DomainPractice />} />
              <Route path="/history" element={<History />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
        <Footer />
        <DonateButton />
      </div>
    </BrowserRouter>
  )
}

export default App
