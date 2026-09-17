import api from '../api'

export async function getNotifications(params = {}) {
  const res = await api.get('/v3/notifications', { params })
  return res.data?.data || res.data
}

export async function getUnreadCount() {
  const res = await api.get('/v3/notifications/unread-count')
  return res.data?.data?.count ?? res.data?.count ?? 0
}

export async function markAsRead(notificationId) {
  const res = await api.put(`/v3/notifications/${notificationId}/read`)
  return res.data
}

export async function markAllAsRead(type = null) {
  const res = await api.put('/v3/notifications/read-all', { type })
  return res.data
}

export async function deleteNotification(notificationId) {
  const res = await api.delete(`/v3/notifications/${notificationId}`)
  return res.data
}
