import api from '../api'

export async function getReviewPlans(status) {
  const res = await api.get('/v3/review-plans', { params: status ? { status } : {} })
  return res.data?.data || res.data
}

export async function createReviewPlan(data) {
  const res = await api.post('/v3/review-plans', data)
  return res.data?.data || res.data
}

export async function deleteReviewPlan(id) {
  const res = await api.delete(`/v3/review-plans/${id}`)
  return res.data
}

export async function executeReviewPlan(id) {
  const res = await api.post(`/v3/review-plans/${id}/execute`)
  return res.data?.data || res.data
}

export async function getReviewPlanStats(id) {
  const res = await api.get(`/v3/review-plans/${id}/stats`)
  return res.data?.data || res.data
}
