import api from '../api'

export async function getBanks(params = {}) {
  const {
    subjectCode,
    managerId,
    isPublic,
    search,
    page = 1,
    limit = 20,
  } = params

  const queryParams = new URLSearchParams()
  if (subjectCode) queryParams.append('subjectCode', subjectCode)
  if (managerId) queryParams.append('managerId', managerId)
  if (isPublic !== undefined) queryParams.append('isPublic', isPublic)
  if (search) queryParams.append('search', search)
  queryParams.append('page', page)
  queryParams.append('limit', limit)

  const res = await api.get(`/v3/banks?${queryParams.toString()}`)
  return {
    data: res.data?.data || [],
    meta: res.data?.meta || { page: 1, limit: 20, total: 0, totalPages: 0 },
  }
}

export async function getBank(id) {
  const res = await api.get(`/v3/banks/${id}`)
  return res.data?.data
}

export async function createBank(payload) {
  const res = await api.post('/v3/banks', payload)
  if (res.data?.success) return res.data.data
  throw new Error(res.data?.message || '创建题库失败')
}

export async function updateBank(id, payload) {
  const res = await api.put(`/v3/banks/${id}`, payload)
  if (res.data?.success) return res.data.data
  throw new Error(res.data?.message || '更新题库失败')
}

export async function deleteBank(id) {
  const res = await api.delete(`/v3/banks/${id}`)
  if (!res.data?.success) throw new Error(res.data?.message || '删除题库失败')
}
