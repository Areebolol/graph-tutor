import api from '../api'

export async function getWrongQuestions(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.category) queryParams.append('category', params.category)
  if (params.masteryStatus) queryParams.append('masteryStatus', params.masteryStatus)
  if (params.subjectCode) queryParams.append('subjectCode', params.subjectCode)
  if (params.searchKeyword) queryParams.append('searchKeyword', params.searchKeyword)
  if (params.page) queryParams.append('page', params.page)
  if (params.limit) queryParams.append('limit', params.limit)
  if (params.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

  const res = await api.get(`/v3/wrong-questions?${queryParams.toString()}`)
  return res.data.data
}

export async function getWrongQuestionStats() {
  const res = await api.get('/v3/wrong-questions/stats')
  return res.data.data
}

export async function markAsMastered(questionId) {
  const res = await api.put(`/v3/wrong-questions/${questionId}/mastered`)
  return res.data.data
}

export async function unmarkAsMastered(questionId) {
  const res = await api.delete(`/v3/wrong-questions/${questionId}/mastered`)
  return res.data.data
}

export async function deleteWrongQuestion(questionId) {
  const res = await api.delete(`/v3/wrong-questions/${questionId}`)
  return res.data
}
