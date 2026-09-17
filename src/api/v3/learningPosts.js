import api from '../api'

export async function createLearningPost(postData) {
  const res = await api.post('/v3/learning-posts', postData)
  return res.data
}

export async function getLearningPosts(params = {}) {
  const res = await api.get('/v3/learning-posts', { params })
  return res.data
}

export async function toggleLikePost(postId) {
  const res = await api.put(`/v3/learning-posts/${postId}/like`)
  return res.data
}
