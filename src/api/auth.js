import api from './api'

export const login = (data) => api.post('/auth/login', data).then((r) => r.data)
export const register = (data) => api.post('/auth/register', data).then((r) => r.data)

export const getGitHubOAuthUrl = (mode = 'login') =>
  api.get(`/auth/oauth/github/url${mode === 'bind' ? '?mode=bind' : ''}`).then((r) => r.data)

export const getWechatOAuthUrl = (mode = 'login') =>
  api.get(`/auth/oauth/wechat/url${mode === 'bind' ? '?mode=bind' : ''}`).then((r) => r.data)

export const linkExistingAccount = (data) =>
  api.post('/auth/account/link-existing', data).then((r) => r.data)

export const updateProfile = (data) => api.put('/auth/me', data).then((r) => r.data)

export const getMe = () => api.get('/auth/me').then((r) => r.data)
