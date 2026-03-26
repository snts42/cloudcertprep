import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { validatePassword } from '../lib/validation'
import { Header } from '../components/Header'
import { usePageTitle } from '../hooks/usePageTitle'

export function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  usePageTitle('Reset Password | CloudCertPrep')

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User has clicked the reset link
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validatePassword(password, confirmPassword)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-dark">
      <Header showNav={true} />
      <div className="flex-1 flex items-center justify-center px-4">
      <div className="bg-bg-card p-8 rounded-lg shadow-card max-w-md w-full">
        <h1 className="text-xl font-semibold text-text-primary mb-2">Reset Password</h1>
        <p className="text-text-muted mb-8">Enter your new password</p>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-bg-dark border border-text-muted/30 rounded-lg text-text-primary focus:outline-none focus:border-aws-orange transition-colors"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-bg-dark border border-text-muted/30 rounded-lg text-text-primary focus:outline-none focus:border-aws-orange transition-colors"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {success && (
            <div className="bg-success/10 border border-success text-success px-4 py-3 rounded-lg text-sm">
              Password updated successfully! Redirecting to sign in...
            </div>
          )}

          {error && (
            <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
      </div>
    </div>
  )
}
