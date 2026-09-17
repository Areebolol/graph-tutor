const DEMO_FLAG_KEY = 'gt_demo_mode'
export const DEMO_TOKEN = 'gt_demo_token_v1'

export const DEMO_USER = {
  _id: 'demo-user-001',
  id: 'demo-user-001',
  email: 'demo@graphtutor.local',
  name: '演示用户',
  role: 'admin',
  isAdmin: true,
  isDemo: true,
}

export function isDemoMode() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(DEMO_FLAG_KEY) === '1'
}

export function isDemoToken(token) {
  return Boolean(token && String(token).startsWith('gt_demo_token'))
}

export function enableDemoMode() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DEMO_FLAG_KEY, '1')
}

export function disableDemoMode() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(DEMO_FLAG_KEY)
}

export function getDemoSession() {
  return { token: DEMO_TOKEN, user: { ...DEMO_USER } }
}
