'use client'

import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: 'dark' | 'light'
  setTheme: (t: Theme) => void
}

const STORAGE_KEY = 'khanhos-theme'

export function useTheme(): ThemeContextValue {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [resolvedTheme, setResolved] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme) || 'dark'
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(stored)
  }, [])

  useEffect(() => {
    const apply = () => {
      const root = document.documentElement
      const actual: 'dark' | 'light' =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          : theme
      root.classList.remove('light', 'dark')
      root.classList.add(actual)
      setResolved(actual)
    }
    apply()
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, t)
  }

  return { theme, resolvedTheme, setTheme }
}
