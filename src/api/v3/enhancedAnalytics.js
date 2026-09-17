import api from '../api'

export async function getGraphHeatmap(days = 90) {
  const response = await api.get('/v3/enhanced-analytics/graph-heatmap', {
    params: { days },
  })
  return response.data
}

export async function getSkillTree(subjectCode, days = 90) {
  const response = await api.get('/v3/enhanced-analytics/skill-tree', {
    params: { subjectCode, days },
  })
  return response.data
}
