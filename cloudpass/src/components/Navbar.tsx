import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Navbar() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/mock-exam', label: 'Mock Exam', icon: '📝' },
    { path: '/domain-practice', label: 'Domain Practice', icon: '🎯' },
    { path: '/weak-spot', label: 'Weak Spot', icon: '⚡' },
    { path: '/scenarios', label: 'Scenarios', icon: '💡' },
    { path: '/history', label: 'History', icon: '📈' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 bg-bg-card border-r border-text-muted/20">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-text-muted/20">
            <h1 className="text-2xl font-bold text-aws-orange">CloudCertPrep</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-aws-orange text-white'
                    : 'text-text-primary hover:bg-bg-card-hover'
                }`}
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-text-muted/20">
            <div className="px-4 py-3 bg-bg-dark rounded-lg">
              <p className="text-sm text-text-muted mb-2">Signed in as</p>
              <p className="text-sm text-text-primary font-medium truncate mb-3">
                {user?.email}
              </p>
              <button
                onClick={() => signOut()}
                className="w-full px-4 py-2 text-sm bg-danger hover:bg-danger/90 text-white rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-bg-card border-b border-text-muted/20 z-50">
        <div className="flex items-center justify-between h-full px-4">
          <h1 className="text-xl font-bold text-aws-orange">CloudCertPrep</h1>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm bg-danger hover:bg-danger/90 text-white rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-card border-t border-text-muted/20 z-50">
        <nav className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'text-aws-orange'
                  : 'text-text-muted'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs">{item.label.split(' ')[0]}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
