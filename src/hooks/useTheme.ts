import { createContext, useContext, useState, useCallback, createElement } from 'react'
import type { ReactNode } from 'react'

type Theme = 'light' | 'dark'

function getTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getTheme)

  const toggleTheme = useCallback(() => {
    const root = document.documentElement
    root.classList.add('no-transition')
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      if (next === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      localStorage.setItem('cloudcertprep_theme', next)
      return next
    })
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('no-transition')
      })
    })
  }, [])

  return createElement(ThemeContext.Provider, { value: { theme, toggleTheme } }, children)
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>')
  return ctx
}
