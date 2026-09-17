import api from './api'

export async function getUsers(params = {}) {
  const {
    search,
    role,
    sort = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 20,
  } = params

  const queryParams = new URLSearchParams()
  if (search) queryParams.append('search', search)
  if (role) queryParams.append('role', role)
  queryParams.append('sort', sort)
  queryParams.append('order', order)
  queryParams.append('page', String(page))
  queryParams.append('limit', String(limit))

  const res = await api.get(`/users?${queryParams.toString()}`)
  return {
    data: res.data?.data || [],
    meta: res.data?.meta || { page: 1, limit: 20, total: 0, totalPages: 0 },
  }
}

export async function updateUserRole(id, role) {
  const res = await api.patch(`/users/${id}/role`, { role })
  return res.data?.data || res.data
}

export async function getUserOperationLogs(params = {}) {
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value)
    }
  })
  const res = await api.get(`/users/operation-logs?${queryParams.toString()}`)
  return {
    data: res.data?.data || [],
    meta: res.data?.meta || { page: 1, limit: 20, total: 0, totalPages: 0 },
  }
}

export async function getOperationLogStats(params = {}) {
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value)
    }
  })
  const res = await api.get(`/users/operation-logs/stats?${queryParams.toString()}`)
  return res.data?.data || res.data
}
