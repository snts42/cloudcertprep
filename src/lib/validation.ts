/**
 * Password validation for sign up and password reset flows.
 * Returns error message if validation fails, null if valid.
 */
export function validatePassword(password: string, confirmPassword: string): string | null {
  if (password !== confirmPassword) {
    return 'Passwords do not match'
  }
  
  if (password.length < 6) {
    return 'Password must be at least 6 characters'
  }
  
  return null
}
