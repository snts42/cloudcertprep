import { useState, useCallback } from 'react'

type Theme = 'light' | 'dark'

function getTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function useTheme() {
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

  return { theme, toggleTheme }
}
