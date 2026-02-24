import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Header } from '../components/Header'

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)

  // Set page title based on mode
  useEffect(() => {
    if (isForgotPassword) {
      document.title = "Reset Password | CloudCertPrep"
    } else if (isSignUp) {
      document.title = "Sign Up | CloudCertPrep"
    } else {
      document.title = "Sign In | CloudCertPrep"
    }
    return () => {
      document.title = "CloudCertPrep | Free AWS CLF-C02 Practice Exams"
    }
  }, [isSignUp, isForgotPassword])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          setLoading(false)
          return
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error
        navigate('/')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        navigate('/')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      setSuccess('Password reset link sent! Check your email.')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })

      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-bg-card p-8 rounded-lg shadow-xl max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Sign In'}
            </h2>
            <p className="text-text-muted text-sm">
              {isForgotPassword ? 'Enter your email to receive a reset link' : 'Start practicing for your AWS certification'}
            </p>
          </div>

          {!isForgotPassword && (
            <div className="mb-6 p-4 bg-aws-orange/10 border border-aws-orange/30 rounded-lg">
              <p className="text-sm text-text-muted text-center">
                <span className="font-semibold text-aws-orange">Note:</span> Login required to save your progress and track your exam history.
              </p>
            </div>
          )}

          <form onSubmit={isForgotPassword ? handlePasswordReset : handleEmailAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-bg-dark border border-text-muted/30 rounded-lg text-text-primary focus:outline-none focus:border-aws-orange transition-colors"
              placeholder="you@example.com"
            />
          </div>

          {!isForgotPassword && (
            <>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-bg-dark border border-text-muted/30 rounded-lg text-text-primary focus:outline-none focus:border-aws-orange transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {isSignUp && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-bg-dark border border-text-muted/30 rounded-lg text-text-primary focus:outline-none focus:border-aws-orange transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success text-success px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-aws-orange hover:bg-aws-orange/90 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        {!isSignUp && !isForgotPassword && (
          <div className="mt-4 text-right">
            <button
              onClick={() => {
                setIsForgotPassword(true)
                setError('')
                setSuccess('')
              }}
              className="text-sm text-text-muted hover:text-aws-orange transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}

        {!isForgotPassword && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-text-muted/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-bg-card text-text-muted">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="mt-4 w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              if (isForgotPassword) {
                setIsForgotPassword(false)
              } else {
                setIsSignUp(!isSignUp)
              }
              setError('')
              setSuccess('')
              setConfirmPassword('')
            }}
            className="text-text-muted hover:text-aws-orange transition-colors text-sm"
          >
            {isForgotPassword 
              ? 'Back to Sign In' 
              : isSignUp 
              ? 'Already have an account? Sign In' 
              : "Don't have an account? Sign Up"}
          </button>

          {!isForgotPassword && (
            <>
              <div className="my-4 flex items-center">
                <div className="flex-1 border-t border-text-muted/30"></div>
                <span className="px-4 text-text-muted text-sm">or</span>
                <div className="flex-1 border-t border-text-muted/30"></div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full px-6 py-3 bg-bg-dark hover:bg-bg-card-hover text-text-primary font-medium rounded-lg transition-colors border border-text-muted/30"
              >
                Continue as Guest
              </button>
              <p className="text-xs text-text-muted text-center mt-2">
                Guest mode: Progress will not be saved
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
  )
}
