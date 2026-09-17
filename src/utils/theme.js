const KEY = 'graphtutor_theme'
const KEY_CONTRAST = 'graphtutor_contrast'

export function loadTheme() {
  try {
    const t = localStorage.getItem(KEY) || 'auto'
    const c = localStorage.getItem(KEY_CONTRAST) || 'off'
    applyTheme(t, c)
    return { theme: t, contrast: c }
  } catch {
    return { theme: 'auto', contrast: 'off' }
  }
}

export function applyTheme(theme = 'auto', contrast = 'off') {
  const root = document.documentElement
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'auto' && prefersDark)
  root.classList.toggle('dark', isDark)
  root.classList.toggle('contrast', contrast === 'on')
  try {
    localStorage.setItem(KEY, theme)
    localStorage.setItem(KEY_CONTRAST, contrast)
    localStorage.setItem('THEME', isDark ? 'dark' : 'light')
  } catch {
    /* ignore */
  }
}
