import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

interface HeaderProps {
  showNav?: boolean
}

export function Header({ showNav = false }: HeaderProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <header className="bg-gradient-to-r from-aws-orange to-[#FF7700] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center gap-2 md:gap-3 group">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-xl md:text-3xl font-bold text-aws-orange">☁️</span>
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">
                CloudCertPrep
              </h1>
              <p className="text-xs md:text-sm text-white/90 font-medium hidden md:block">
                AWS Cloud Practitioner Exam Prep
              </p>
            </div>
          </Link>
          
          {/* Navigation and Auth */}
          {showNav && (
            <div className="flex items-center justify-between md:justify-end gap-3 md:gap-6">
              <nav className="flex items-center gap-3 md:gap-6">
                <Link 
                  to="/" 
                  className="text-white/90 hover:text-white font-medium transition-colors text-xs md:text-base"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/history" 
                  className="text-white/90 hover:text-white font-medium transition-colors text-xs md:text-base"
                >
                  History
                </Link>
              </nav>
              
              {user ? (
                <button
                  onClick={() => {
                    supabase.auth.signOut()
                    navigate('/login')
                  }}
                  className="px-2 py-1 md:px-4 md:py-2 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors text-xs md:text-base whitespace-nowrap"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-2 py-1 md:px-4 md:py-2 bg-white hover:bg-white/90 text-aws-orange font-medium rounded-lg transition-colors text-xs md:text-base whitespace-nowrap"
                >
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
