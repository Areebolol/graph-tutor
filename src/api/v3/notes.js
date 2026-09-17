import api from '../api'

export async function getNotes(options = {}) {
  const params = new URLSearchParams()
  Object.entries(options).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    if (Array.isArray(v)) v.forEach((item) => params.append(k, item))
    else params.append(k, v)
  })
  const res = await api.get(`/v3/notes?${params}`)
  return res.data?.data || res.data
}

export async function getPublicNotes(options = {}) {
  const params = new URLSearchParams()
  Object.entries(options).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    if (Array.isArray(v)) v.forEach((item) => params.append(k, item))
    else params.append(k, v)
  })
  const res = await api.get(`/v3/notes/public?${params}`)
  return res.data?.data || res.data
}

export async function getNoteDetail(noteId) {
  const res = await api.get(`/v3/notes/${noteId}`)
  return res.data?.data || res.data
}

export async function createNote(data) {
  const res = await api.post('/v3/notes', data)
  return res.data?.data || res.data
}

export async function updateNote(noteId, data) {
  const res = await api.put(`/v3/notes/${noteId}`, data)
  return res.data?.data || res.data
}

export async function deleteNote(noteId) {
  const res = await api.delete(`/v3/notes/${noteId}`)
  return res.data
}

export async function likeNote(noteId) {
  const res = await api.post(`/v3/notes/${noteId}/like`)
  return res.data
}

export async function generateShareLink(noteId) {
  const res = await api.post(`/v3/notes/${noteId}/share`)
  return res.data?.data || res.data
}

export async function getNoteByShareToken(token) {
  const res = await api.get(`/v3/notes/share/${token}`)
  return res.data?.data || res.data
}

export async function getNoteStats() {
  const res = await api.get('/v3/notes/stats')
  return res.data?.data || res.data
}

export async function getKnowledgeNotes(knowledgeNodeId) {
  return getNotes({ knowledgeNodeId, limit: 50 })
}
