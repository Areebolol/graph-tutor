import api from '../api'

export async function getRoleApplications(params = {}) {
  const res = await api.get('/v3/role-applications', { params })
  return res.data?.data || res.data
}

export async function getMyRoleApplications() {
  const res = await api.get('/v3/role-applications')
  return res.data?.data || res.data
}

export async function applyRole(payload) {
  const res = await api.post('/v3/role-applications', payload)
  return res.data
}

export async function approveRoleApplication(id, payload = {}) {
  const res = await api.post(`/v3/role-applications/${id}/approve`, payload)
  return res.data
}

export async function rejectRoleApplication(id, payload = {}) {
  const res = await api.post(`/v3/role-applications/${id}/reject`, payload)
  return res.data
}
