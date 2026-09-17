import api from '../api'

export async function getQuestions(params = {}) {
  const {
    subjectCode,
    bankId,
    difficulty,
    knowledgeNodeId,
    search,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = params

  const queryParams = new URLSearchParams()
  if (subjectCode) queryParams.append('subjectCode', subjectCode)
  if (bankId) queryParams.append('bankId', bankId)
  if (difficulty) {
    if (Array.isArray(difficulty)) queryParams.append('difficulty', JSON.stringify(difficulty))
    else queryParams.append('difficulty', difficulty)
  }
  if (knowledgeNodeId) queryParams.append('knowledgeNodeId', knowledgeNodeId)
  if (search) queryParams.append('search', search)
  queryParams.append('page', page)
  queryParams.append('limit', limit)
  if (sort) queryParams.append('sort', sort)

  const res = await api.get(`/v3/questions?${queryParams.toString()}`)
  return {
    data: res.data?.data || [],
    meta: res.data?.meta || { page: 1, limit: 20, total: 0, totalPages: 0 },
  }
}

export async function getQuestion(id) {
  const res = await api.get(`/v3/questions/${id}`)
  return res.data?.data
}

export async function createQuestion(payload) {
  const res = await api.post('/v3/questions', payload)
  if (res.data?.success) return res.data.data
  throw new Error(res.data?.message || '创建题目失败')
}

export async function updateQuestion(id, payload) {
  const res = await api.put(`/v3/questions/${id}`, payload)
  if (res.data?.success) return res.data.data
  throw new Error(res.data?.message || '更新题目失败')
}

export async function deleteQuestion(id) {
  const res = await api.delete(`/v3/questions/${id}`)
  if (!res.data?.success) throw new Error(res.data?.message || '删除题目失败')
}
