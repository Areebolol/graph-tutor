import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api, { getStoredToken, setStoredToken } from '../api/api'
import {
  clearAllTokens,
  getStoredRefreshToken,
  proactiveRefreshToken,
  setStoredRefreshToken,
  setupTokenRefreshInterceptor,
} from '../utils/tokenRefresh'
import {
  DEMO_TOKEN,
  DEMO_USER,
  disableDemoMode,
  enableDemoMode,
  getDemoSession,
  isDemoMode,
  isDemoToken,
} from '../utils/demoAuth'

function extractLoginPayload(resData) {
  const body = resData || {}
  const root = body.data && typeof body.data === 'object' ? body.data : body

  const tokenCandidate =
    root.token ||
    root.accessToken ||
    root.jwt ||
    root.id_token ||
    (root.auth && (root.auth.token || root.auth.accessToken))

  const refreshTokenCandidate = root.refreshToken || (root.auth && root.auth.refreshToken)
  const userCandidate = root.user || root.profile || root.account || null

  return {
    token: tokenCandidate,
    refreshToken: refreshTokenCandidate,
    user: userCandidate,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(getStoredToken())
  const loading = ref(true)
  const demoMode = ref(isDemoMode() || isDemoToken(getStoredToken()))
  let checkInterval = null

  const isAuthenticated = computed(() => Boolean(user.value && token.value))

  function bindTokenExpiredListener() {
    const handleTokenExpired = () => {
      if (isDemoMode() || isDemoToken(token.value)) return
      clearAllTokens()
      user.value = null
      token.value = null
      demoMode.value = false
    }
    window.addEventListener('auth:token-expired', handleTokenExpired)
    return () => window.removeEventListener('auth:token-expired', handleTokenExpired)
  }

  async function bootstrap() {
    setupTokenRefreshInterceptor()
    bindTokenExpiredListener()

    checkInterval = setInterval(() => {
      if (demoMode.value || isDemoToken(token.value)) return
      proactiveRefreshToken().then((refreshed) => {
        if (refreshed) {
          const newToken = getStoredToken()
          if (newToken && newToken !== token.value) {
            token.value = newToken
          }
        }
      })
    }, 5 * 60 * 1000)

    const t = getStoredToken()
    if (!t) {
      loading.value = false
      return
    }

    if (isDemoToken(t) || isDemoMode()) {
      enableDemoMode()
      setStoredToken(DEMO_TOKEN)
      token.value = DEMO_TOKEN
      user.value = { ...DEMO_USER }
      demoMode.value = true
      loading.value = false
      return
    }

    token.value = t
    let timeoutId = null

    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('请求超时')), 3000)
      })
      const res = await Promise.race([api.get('/auth/me'), timeoutPromise])
      clearTimeout(timeoutId)
      const data = res.data || {}
      user.value = data.user || data
      token.value = getStoredToken() || t
      demoMode.value = false
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId)
      console.warn('/auth/me 失败:', err?.message || err?.response?.status)
      if (err?.message === '请求超时' || err?.code === 'ECONNABORTED') {
        user.value = null
      } else {
        setStoredToken(null)
        user.value = null
        token.value = null
      }
      demoMode.value = false
    } finally {
      loading.value = false
    }
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    if (res.data?.success === false) {
      throw new Error(res.data?.message || '登录失败')
    }

    const { token: t, refreshToken: rt, user: u } = extractLoginPayload(res.data)
    if (!t || !u) {
      throw new Error(res.data?.message || '登录接口返回格式不符合预期，需要包含 token 和 user。')
    }

    disableDemoMode()
    setStoredToken(t)
    if (rt) setStoredRefreshToken(rt)
    token.value = t
    user.value = u
    demoMode.value = false
    return u
  }

  function loginAsDemo(role = 'admin') {
    const session = getDemoSession()
    const u = {
      ...session.user,
      role,
      isAdmin: role === 'admin',
    }
    enableDemoMode()
    setStoredToken(session.token)
    setStoredRefreshToken(null)
    token.value = session.token
    user.value = u
    demoMode.value = true
    return u
  }

  async function loginWithSms(phone, code) {
    const res = await api.post('/auth/sms/login', { phone, code })
    const { token: t, refreshToken: rt, user: u } = extractLoginPayload(res.data)
    if (!t || !u) throw new Error(res.data?.message || '登录失败')
    disableDemoMode()
    setStoredToken(t)
    if (rt) setStoredRefreshToken(rt)
    token.value = t
    user.value = u
    demoMode.value = false
    return u
  }

  async function register(payload) {
    const res = await api.post('/auth/register', payload)
    const { token: t, refreshToken: rt, user: u } = extractLoginPayload(res.data)
    if (t && u) {
      disableDemoMode()
      setStoredToken(t)
      if (rt) setStoredRefreshToken(rt)
      token.value = t
      user.value = u
      demoMode.value = false
    }
    return u
  }

  async function logout() {
    const wasDemo = demoMode.value || isDemoToken(token.value)
    const refreshToken = getStoredRefreshToken()
    if (refreshToken && !wasDemo) {
      try {
        await api.post('/auth/logout', { refreshToken })
      } catch (error) {
        console.error('登出接口调用失败:', error)
      }
    }
    disableDemoMode()
    clearAllTokens()
    token.value = null
    user.value = null
    demoMode.value = false
  }

  function setUser(next) {
    user.value = typeof next === 'function' ? next(user.value) : next
  }

  function dispose() {
    if (checkInterval) clearInterval(checkInterval)
  }

  return {
    user,
    token,
    loading,
    demoMode,
    isAuthenticated,
    bootstrap,
    login,
    loginAsDemo,
    loginWithSms,
    register,
    logout,
    setUser,
    dispose,
  }
})
