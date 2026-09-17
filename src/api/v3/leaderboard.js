import api from '../api'

export async function getLeaderboard(params = {}) {
  const res = await api.get('/v3/leaderboard', { params })
  return res.data?.data || res.data
}
