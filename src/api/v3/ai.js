import api from '../api'

export async function generateQuestions(config, asyncMode = false) {
  const res = await api.post('/v3/ai/generate-questions', {
    ...config,
    async: asyncMode,
  })
  if (res.data?.success) return res.data.data
  throw new Error(res.data?.message || '生成题目失败')
}

export async function getAIStats() {
  const res = await api.get('/v3/ai/stats')
  if (res.data?.success) return res.data.data
  return res.data?.data || res.data
}
