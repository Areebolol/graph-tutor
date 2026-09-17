import api from '../api'

export async function sendMessage(data) {
  const res = await api.post('/v3/messages', data)
  return res.data.data
}

export async function getConversations() {
  const res = await api.get('/v3/messages/conversations')
  return res.data.data
}

export async function getConversation(userId, params = {}) {
  const res = await api.get(`/v3/messages/conversation/${userId}`, { params })
  return res.data.data
}

export async function markMessagesAsRead(userId) {
  const res = await api.put(`/v3/messages/read/${userId}`)
  return res.data.data
}

export async function getUnreadCount() {
  const res = await api.get('/v3/messages/unread')
  return res.data.data.count
}
