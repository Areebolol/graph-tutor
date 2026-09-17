import api from '../api/api'

let csrfToken = null
let tokenPromise = null

export function getCsrfTokenFromCookie() {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'XSRF-TOKEN' || name === 'xsrf-token') {
      return decodeURIComponent(value)
    }
  }
  return null
}

export async function fetchCsrfToken() {
  try {
    const response = await api.get('/auth/csrf-token')
    const token = response.data?.csrfToken || getCsrfTokenFromCookie()
    if (token) {
      csrfToken = token
      return token
    }
    throw new Error('无法获取CSRF token')
  } catch (error) {
    console.error('获取CSRF token失败:', error)
    const cookieToken = getCsrfTokenFromCookie()
    if (cookieToken) {
      csrfToken = cookieToken
      return cookieToken
    }
    throw error
  }
}

export async function getCsrfToken(forceRefresh = false) {
  if (csrfToken && !forceRefresh) return csrfToken

  const cookieToken = getCsrfTokenFromCookie()
  if (cookieToken && !forceRefresh) {
    csrfToken = cookieToken
    return cookieToken
  }

  if (tokenPromise) return tokenPromise

  tokenPromise = fetchCsrfToken().finally(() => {
    tokenPromise = null
  })
  return tokenPromise
}

export function clearCsrfToken() {
  csrfToken = null
  tokenPromise = null
}

export async function addCsrfTokenToRequest(config) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(config.method?.toUpperCase())) {
    return config
  }

  try {
    const { isDemoMode, isDemoToken } = await import('./demoAuth.js')
    const { getStoredToken } = await import('../api/api.js')
    if (isDemoMode() || isDemoToken(getStoredToken())) {
      return config
    }
  } catch {
    // ignore
  }

  try {
    const token = await getCsrfToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers['X-XSRF-TOKEN'] = token
    }
  } catch (error) {
    console.warn('添加CSRF token失败:', error)
  }

  return config
}

export async function initCsrfToken() {
  try {
    const { isDemoMode, isDemoToken } = await import('./demoAuth.js')
    const { getStoredToken } = await import('../api/api.js')
    if (isDemoMode() || isDemoToken(getStoredToken())) return
    await getCsrfToken()
  } catch (error) {
    console.warn('初始化CSRF token失败:', error)
  }
}
