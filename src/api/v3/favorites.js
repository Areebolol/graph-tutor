import api from '../api'

export async function getFavoriteFolders() {
  const response = await api.get('/v3/favorites/folders')
  return response.data
}

export async function createFavoriteFolder(data) {
  const response = await api.post('/v3/favorites/folders', data)
  return response.data
}

export async function deleteFavoriteFolder(folderId) {
  const response = await api.delete(`/v3/favorites/folders/${folderId}`)
  return response.data
}

export async function getFavorites(options = {}) {
  const params = new URLSearchParams()
  if (options.folderId) params.append('folderId', options.folderId)
  if (options.searchKeyword) params.append('searchKeyword', options.searchKeyword)
  if (options.page) params.append('page', options.page)
  if (options.limit) params.append('limit', options.limit)

  const response = await api.get(`/v3/favorites?${params.toString()}`)
  return response.data
}

export async function removeFavorite(questionId, folderId) {
  const response = await api.delete(`/v3/favorites/${questionId}/${folderId}`)
  return response.data
}
