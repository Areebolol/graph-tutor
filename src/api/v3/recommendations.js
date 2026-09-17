import api from '../api'

export async function getRecommendedQuestions(params = {}) {
  const {
    limit = 10,
    subjectCode,
    bankId,
    strategy = 'adaptive',
    includeReasons = false,
  } = params

  const queryParams = new URLSearchParams()
  queryParams.append('limit', String(limit))
  if (subjectCode) queryParams.append('subjectCode', subjectCode)
  if (bankId) queryParams.append('bankId', bankId)
  if (strategy) queryParams.append('strategy', strategy)
  if (includeReasons === false) queryParams.append('includeReasons', 'false')

  const res = await api.get(`/v3/recommendations/questions?${queryParams.toString()}`)
  if (res.data?.success) return res.data.data
  throw new Error(res.data?.message || '获取推荐题目失败')
}
