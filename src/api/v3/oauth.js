import api from '../api'

export async function getOAuthBinds() {
  const res = await api.get('/v3/oauth/binds')
  return res.data?.data || res.data || { github: false, wechat: false }
}

export async function bindOAuth(provider) {
  const res = await api.post('/v3/oauth/bind', { provider })
  if (res.data?.success === false) throw new Error(res.data?.message || '绑定失败')
  return res.data?.data || res.data
}

export async function unbindOAuth(provider) {
  const res = await api.post('/v3/oauth/unbind', { provider })
  if (res.data?.success === false) throw new Error(res.data?.message || '解绑失败')
  return res.data?.data || res.data
}
