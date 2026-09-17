import api from '../api'

export async function getSubjects(params = {}) {
  const { tree, level, enabled } = params
  const queryParams = new URLSearchParams()
  if (tree) queryParams.append('tree', 'true')
  if (level) queryParams.append('level', level)
  if (enabled !== undefined) queryParams.append('enabled', enabled)
  const res = await api.get(`/v3/subjects?${queryParams.toString()}`)
  return res.data?.data || []
}

export async function getSubjectTree() {
  const res = await api.get('/v3/subjects?tree=true')
  return res.data?.data || []
}

export async function createSubject(payload) {
  const res = await api.post('/v3/subjects', payload)
  if (res.data?.success) return res.data.data
  throw new Error(res.data?.message || '创建学科失败')
}

export async function updateSubject(code, payload) {
  const res = await api.put(`/v3/subjects/${code}`, payload)
  if (res.data?.success) return res.data.data
  throw new Error(res.data?.message || '更新学科失败')
}

export async function deleteSubject(code) {
  const res = await api.delete(`/v3/subjects/${code}`)
  if (!res.data?.success) throw new Error(res.data?.message || '删除学科失败')
}
