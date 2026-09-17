import api, { getStoredToken, setStoredToken } from '../api/api'

const REFRESH_TOKEN_KEY = 'gt_refresh_token'
let isRefreshing = false
let refreshPromise = null

export function getStoredRefreshToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setStoredRefreshToken(token) {
  if (typeof window === 'undefined') return
  if (token) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export function clearAllTokens() {
  setStoredToken(null)
  setStoredRefreshToken(null)
}

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return null

  try {
    const response = await api.post('/auth/refresh', { refreshToken })
    const data = response.data

    if (data.success && data.accessToken) {
      setStoredToken(data.accessToken)
      if (data.refreshToken) {
        setStoredRefreshToken(data.refreshToken)
      }
      return data.accessToken
    }
    return null
  } catch (error) {
    console.error('刷新token失败:', error)
    clearAllTokens()
    return null
  }
}

export function setupTokenRefreshInterceptor() {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          try {
            const newToken = await refreshPromise
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return api(originalRequest)
            }
          } catch (refreshError) {
            return Promise.reject(refreshError)
          }
        }

        isRefreshing = true
        originalRequest._retry = true
        refreshPromise = refreshAccessToken()

        try {
          const newToken = await refreshPromise
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            isRefreshing = false
            refreshPromise = null
            return api(originalRequest)
          }

          clearAllTokens()
          isRefreshing = false
          refreshPromise = null
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.dispatchEvent(new CustomEvent('auth:token-expired'))
          }
          return Promise.reject(error)
        } catch (refreshError) {
          isRefreshing = false
          refreshPromise = null
          clearAllTokens()
          return Promise.reject(refreshError)
        }
      }

      return Promise.reject(error)
    },
  )
}

export function isTokenExpiringSoon(token) {
  if (!token) return true
  if (String(token).startsWith('gt_demo_token')) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000
    return exp - Date.now() < 5 * 60 * 1000
  } catch {
    return true
  }
}

export async function proactiveRefreshToken() {
  const accessToken = getStoredToken()
  const refreshToken = getStoredRefreshToken()
  if (!accessToken || !refreshToken) return false
  if (String(accessToken).startsWith('gt_demo_token')) return false
  if (isTokenExpiringSoon(accessToken)) {
    const newToken = await refreshAccessToken()
    return !!newToken
  }
  return false
}
