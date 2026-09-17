import api from '../api'

export async function getGroups(params = {}) {
  const res = await api.get('/v3/groups', { params })
  if (res.data?.success) return res.data.data
  return res.data?.data || res.data
}

export async function getGroup(id) {
  const res = await api.get(`/v3/groups/${id}`)
  if (res.data?.success) return res.data.data
  return res.data?.data || res.data
}

export async function createGroup(data) {
  const res = await api.post('/v3/groups', data)
  if (res.data?.success) return res.data.data
  throw new Error(res.data?.message || '创建群组失败')
}

export async function deleteGroup(id) {
  const res = await api.delete(`/v3/groups/${id}`)
  if (!res.data?.success) throw new Error(res.data?.message || '删除群组失败')
}

export async function joinGroupByCode(code) {
  const res = await api.post('/v3/groups/join', { code })
  if (res.data?.success) return res.data.data
  throw new Error(res.data?.message || '加入群组失败')
}

export async function removeMemberFromGroup(groupId, memberId) {
  const res = await api.delete(`/v3/groups/${groupId}/members/${memberId}`)
  if (!res.data?.success) throw new Error(res.data?.message || '移除成员失败')
}

export async function updateGroup(id, data) {
  const res = await api.put(`/v3/groups/${id}`, data)
  if (res.data?.success) return res.data.data
  return res.data?.data || res.data
}
