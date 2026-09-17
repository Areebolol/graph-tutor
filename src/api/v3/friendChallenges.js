import api from '../api'

export async function createFriendChallenge(participantId, challengeData) {
  const res = await api.post('/v3/friend-challenges', { participantId, ...challengeData })
  return res.data?.data || res.data
}

export async function getFriendChallenges(params = {}) {
  const res = await api.get('/v3/friend-challenges', { params })
  return res.data?.data || res.data
}

export async function getChallengeStats() {
  const res = await api.get('/v3/friend-challenges/stats')
  return res.data?.data || res.data
}

export async function acceptChallenge(challengeId) {
  const res = await api.put(`/v3/friend-challenges/${challengeId}/accept`)
  return res.data
}

export async function cancelChallenge(challengeId) {
  const res = await api.put(`/v3/friend-challenges/${challengeId}/cancel`)
  return res.data
}

export async function updateChallengeProgress(challengeId) {
  const res = await api.put(`/v3/friend-challenges/${challengeId}/progress`)
  return res.data
}
