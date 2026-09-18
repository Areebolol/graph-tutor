const ACCOUNTS_KEY = 'gt_local_accounts_v1'
const SESSION_KEY = 'gt_local_session_v1'

export const DEMO_LOGIN_EMAIL = 'demo@graphtutor.local'
export const DEMO_LOGIN_PASSWORD = 'demo1234'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

async function hashPassword(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`gt:${password}`))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function loadAccounts() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function saveAccounts(list) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list))
}

export function findAccountByEmail(email) {
  const e = normalizeEmail(email)
  return loadAccounts().find((a) => a.email === e) || null
}

export function getLocalSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setLocalSession(account) {
  if (typeof window === 'undefined') return
  if (!account) {
    window.localStorage.removeItem(SESSION_KEY)
    return
  }
  window.localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: account.id, email: account.email, name: account.name }),
  )
}

export function clearLocalSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SESSION_KEY)
}

export function toAuthUser(account) {
  return {
    _id: 'demo-user-001',
    id: 'demo-user-001',
    email: account.email,
    name: account.name,
    role: 'admin',
    isAdmin: true,
    isDemo: account.email === DEMO_LOGIN_EMAIL,
    hasPassword: true,
    localAccountId: account.id,
  }
}

export async function ensureDemoAccount() {
  const list = loadAccounts()
  if (list.some((a) => a.email === DEMO_LOGIN_EMAIL)) return
  list.push({
    id: 'acct-demo',
    email: DEMO_LOGIN_EMAIL,
    name: '演示用户',
    passwordHash: await hashPassword(DEMO_LOGIN_PASSWORD),
    createdAt: new Date().toISOString(),
  })
  saveAccounts(list)
}

export async function loginLocalAccount(email, password) {
  await ensureDemoAccount()
  const account = findAccountByEmail(email)
  if (!account) {
    const err = new Error('该邮箱尚未注册，请先注册')
    err.code = 'NOT_FOUND'
    throw err
  }
  const hash = await hashPassword(password)
  if (hash !== account.passwordHash) {
    const err = new Error('邮箱或密码错误')
    err.code = 'BAD_PASSWORD'
    throw err
  }
  setLocalSession(account)
  return account
}

export async function registerLocalAccount({ email, password, name }) {
  await ensureDemoAccount()
  const e = normalizeEmail(email)
  if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
    throw new Error('请输入有效邮箱')
  }
  if (!password || password.length < 6) {
    throw new Error('密码至少 6 位')
  }
  const nick = String(name || '').trim()
  if (!nick) throw new Error('请输入昵称')
  if (findAccountByEmail(e)) {
    const err = new Error('该邮箱已注册，请直接登录')
    err.code = 'EXISTS'
    throw err
  }
  const account = {
    id: `acct-${Date.now()}`,
    email: e,
    name: nick,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  }
  const list = loadAccounts()
  list.push(account)
  saveAccounts(list)
  setLocalSession(account)
  return account
}

export async function resetLocalPassword(email, newPassword) {
  await ensureDemoAccount()
  const account = findAccountByEmail(email)
  if (!account) throw new Error('该邮箱尚未注册')
  if (!newPassword || newPassword.length < 6) throw new Error('密码至少 6 位')
  account.passwordHash = await hashPassword(newPassword)
  saveAccounts(loadAccounts().map((a) => (a.email === account.email ? account : a)))
  return account
}

export async function changeLocalPassword(email, oldPassword, newPassword) {
  await ensureDemoAccount()
  const account = findAccountByEmail(email)
  if (!account) throw new Error('账号不存在')
  if (oldPassword) {
    const hash = await hashPassword(oldPassword)
    if (hash !== account.passwordHash) throw new Error('当前密码不正确')
  }
  if (!newPassword || newPassword.length < 6) throw new Error('密码至少 6 位')
  if (oldPassword && oldPassword === newPassword) throw new Error('新密码不能与当前密码相同')
  account.passwordHash = await hashPassword(newPassword)
  saveAccounts(loadAccounts().map((a) => (a.email === account.email ? account : a)))
  return account
}

export function updateLocalAccountProfile(email, patch = {}) {
  const account = findAccountByEmail(email)
  if (!account) return null
  if (patch.name) account.name = String(patch.name).trim()
  saveAccounts(loadAccounts().map((a) => (a.email === account.email ? account : a)))
  const session = getLocalSession()
  if (session?.email === account.email) setLocalSession(account)
  return account
}
