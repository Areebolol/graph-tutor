import api from '../api'

export async function getDiscussions(params = {}) {
  const res = await api.get('/v3/discussions', { params })
  return res.data
}

export async function createDiscussion(data) {
  const res = await api.post('/v3/discussions', data)
  return res.data
}

export async function getDiscussionDetail(id) {
  const res = await api.get(`/v3/discussions/${id}`)
  return res.data
}

export async function addReply(discussionId, content, parentReplyId = null) {
  const res = await api.post(`/v3/discussions/${discussionId}/replies`, {
    content,
    parentReplyId,
  })
  return res.data
}

export async function likeDiscussion(id) {
  const res = await api.put(`/v3/discussions/${id}/like`)
  return res.data
}
