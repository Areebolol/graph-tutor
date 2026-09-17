import api from '../api'

export async function getAchievements(params = {}) {
  const res = await api.get('/v3/achievements', { params })
  if (res.data?.success) return res.data.data
  return res.data?.data || res.data
}

export async function getAchievementStats() {
  const res = await api.get('/v3/achievements/stats')
  if (res.data?.success) return res.data.data
  return res.data?.data || res.data
}

export async function checkAchievements(params = {}) {
  const res = await api.post('/v3/achievements/check', params)
  if (res.data?.success) return res.data.data
  return res.data?.data || res.data
}
