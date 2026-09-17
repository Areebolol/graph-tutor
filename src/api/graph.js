import api from './api'

export async function listNodes({ parentId = '', q = '', tree = false } = {}) {
  const params = {}
  if (parentId) params.parentId = parentId
  if (q) params.q = q
  if (tree) params.tree = 1
  const { data } = await api.get('/graph/nodes', { params })
  return Array.isArray(data) ? data : data?.nodes || []
}

export async function graphStats() {
  const { data } = await api.get('/graph/stats')
  return data
}

export async function createNode({ key, name, parentId = null, order = 0, meta = {} }) {
  const { data } = await api.post('/graph/nodes', { key, name, parentId, order, meta })
  return data
}

export async function updateNode(id, patch) {
  const { data } = await api.put(`/graph/nodes/${encodeURIComponent(id)}`, patch || {})
  return data
}

export async function deleteNode(id, { cascade = false } = {}) {
  try {
    const { data } = await api.delete(
      `/graph/nodes/${encodeURIComponent(id)}${cascade ? '?cascade=1' : ''}`,
    )
    return data
  } catch {
    const { data } = await api.delete(`/graph/${encodeURIComponent(id)}`)
    return data
  }
}

export async function reorderNodes(items) {
  const arr = Array.isArray(items) ? items : []
  const { data } = await api.post('/graph/nodes/reorder', arr)
  return data
}

export async function exportGraph() {
  const { data } = await api.get('/graph/export')
  return data
}

export async function exportGraphRaw() {
  const res = await api.get('/graph/export')
  return JSON.stringify(res.data, null, 2)
}

export async function importGraph(nodes) {
  const { data } = await api.post('/graph/import', { nodes })
  return data
}
