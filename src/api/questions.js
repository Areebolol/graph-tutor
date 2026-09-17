import api from './api'

export async function listQuestions(params = {}) {
  const res = await api.get('/questions', { params })
  const data = res.data || {}
  const items = data.items || data.data || data || []
  return Array.isArray(items) ? items : []
}
