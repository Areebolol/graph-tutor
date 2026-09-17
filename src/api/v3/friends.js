import api from '../api'

export async function getFriends(params = {}) {
  const res = await api.get('/v3/friends', { params })
  return res.data.data
}

export async function getFriendRequests(params = {}) {
  const res = await api.get('/v3/friends/requests', { params })
  return res.data.data
}

export async function sendFriendRequest(toUserId, message = '') {
  const res = await api.post('/v3/friends/requests', { toUserId, message })
  return res.data.data
}

export async function acceptFriendRequest(requestId) {
  const res = await api.put(`/v3/friends/requests/${requestId}/accept`)
  return res.data.data
}

export async function rejectFriendRequest(requestId) {
  const res = await api.put(`/v3/friends/requests/${requestId}/reject`)
  return res.data.data
}

export async function cancelFriendRequest(requestId) {
  const res = await api.delete(`/v3/friends/requests/${requestId}`)
  return res.data.data
}

export async function deleteFriend(friendId) {
  await api.delete(`/v3/friends/${friendId}`)
}

export async function checkFriendship(userId) {
  const res = await api.get(`/v3/friends/check/${userId}`)
  return res.data.data.isFriend
}

export async function getPublicUserProfile(userId) {
  const res = await api.get(`/v3/friends/profile/${userId}`)
  return res.data.data
}

export async function searchUsers(params = {}) {
  const res = await api.get('/v3/friends/search', { params })
  return res.data.data
}
