import axios from 'axios'
import { API_CONFIG } from '../constants/index.js'
import { demoAdapter } from '../demo/adapter.js'
import { isDemoMode, isDemoToken } from '../utils/demoAuth.js'

const TOKEN_KEYS = API_CONFIG.TOKEN_KEYS

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
})

export function getStoredToken() {
  if (typeof window === 'undefined') return null
  for (const k of TOKEN_KEYS) {
    const v = window.localStorage.getItem(k)
    if (v) return v
  }
  return null
}

export function setStoredToken(token) {
  if (typeof window === 'undefined') return
  if (token) {
    TOKEN_KEYS.forEach((k) => window.localStorage.setItem(k, token))
  } else {
    TOKEN_KEYS.forEach((k) => window.localStorage.removeItem(k))
  }
}

api.interceptors.request.use(
  async (config) => {
    const token = getStoredToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    if (isDemoMode() || isDemoToken(token)) {
      config.adapter = demoAdapter
    }
    const { addCsrfTokenToRequest } = await import('../utils/csrf.js')
    return addCsrfTokenToRequest(config)
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn('API 401 未授权:', error.config?.url)
    }
    if (error?.response?.status === 503) {
      const msg = error.response?.data?.message || error.response?.data?.error
      error.message = msg || '后端服务未启动，请先启动 GraphTutor server'
    }
    return Promise.reject(error)
  },
)

export default api
