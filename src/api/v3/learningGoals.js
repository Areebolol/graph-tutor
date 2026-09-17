import api from '../api'

export async function getLearningGoals(params = {}) {
  const res = await api.get('/v3/learning-goals', { params })
  if (res.data?.success) return res.data.data
  return res.data?.data || res.data
}

export async function createLearningGoal(payload) {
  const res = await api.post('/v3/learning-goals', payload)
  if (res.data?.success) return res.data.data
  throw new Error(res.data?.message || '创建失败')
}

export async function updateLearningGoal(id, payload) {
  const res = await api.put(`/v3/learning-goals/${id}`, payload)
  if (res.data?.success) return res.data.data
  throw new Error(res.data?.message || '更新失败')
}

export async function deleteLearningGoal(id) {
  const res = await api.delete(`/v3/learning-goals/${id}`)
  if (!res.data?.success) throw new Error(res.data?.message || '删除失败')
}

export async function getLearningGoalStats() {
  const res = await api.get('/v3/learning-goals/stats')
  if (res.data?.success) return res.data.data
  return res.data?.data || res.data
}
