import api, { getStoredToken } from './api'

export async function getKnowledgeMastery(params = {}) {
  const { days = 30, subjectCode, minQuestions = 3 } = params
  const queryParams = new URLSearchParams()
  if (days) queryParams.append('days', String(days))
  if (subjectCode) queryParams.append('subjectCode', subjectCode)
  if (minQuestions) queryParams.append('minQuestions', String(minQuestions))

  const res = await api.get(`/analytics/mastery?${queryParams.toString()}`, {
    headers: { Authorization: `Bearer ${getStoredToken() || ''}` },
  })
  return res.data?.data || res.data
}

export async function getLearningTrend(params = {}) {
  const { days = 30 } = params
  const res = await api.get(`/analytics/trend?days=${days}`, {
    headers: { Authorization: `Bearer ${getStoredToken() || ''}` },
  })
  return res.data?.data ?? res.data
}
