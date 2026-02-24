import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Footer } from './components/Footer'
import { DonateButton } from './components/DonateButton'
import { Login } from './pages/Login'
import { ResetPassword } from './pages/ResetPassword'
import { Dashboard } from './pages/Dashboard'
import { MockExam } from './pages/MockExam'
import { DomainPractice } from './pages/DomainPractice'
import { History } from './pages/History'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/mock-exam" element={<MockExam />} />
        <Route path="/domain-practice" element={<DomainPractice />} />
        <Route path="/history" element={<History />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
        <DonateButton />
      </div>
    </BrowserRouter>
  )
}

export default App
