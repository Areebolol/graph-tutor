import api from '../api'

/** 使用 /v3/...（axios baseURL 已是 /api） */
export async function getStudyStats(options = {}) {
  const params = new URLSearchParams()
  if (options.startDate) params.append('startDate', options.startDate)
  if (options.endDate) params.append('endDate', options.endDate)
  const response = await api.get(`/v3/study-plans/stats?${params.toString()}`)
  return response.data
}

export async function getStudyPlans(options = {}) {
  const params = new URLSearchParams()
  if (options.status) params.append('status', options.status)
  if (options.page) params.append('page', options.page)
  if (options.limit) params.append('limit', options.limit)
  const response = await api.get(`/v3/study-plans?${params.toString()}`)
  return response.data
}

export async function createStudyPlan(data) {
  const response = await api.post('/v3/study-plans', data)
  return response.data
}

export async function updateStudyPlan(planId, data) {
  const response = await api.put(`/v3/study-plans/${planId}`, data)
  return response.data
}

export async function deleteStudyPlan(planId) {
  const response = await api.delete(`/v3/study-plans/${planId}`)
  return response.data
}

export async function checkIn(planId, data) {
  const response = await api.post(`/v3/study-plans/${planId}/check-in`, data)
  return response.data
}

export async function getAllCheckIns(options = {}) {
  const params = new URLSearchParams()
  if (options.page) params.append('page', options.page)
  if (options.limit) params.append('limit', options.limit)
  const response = await api.get(`/v3/study-plans/check-ins?${params.toString()}`)
  return response.data
}
