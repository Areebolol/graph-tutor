import api from './api'

export async function getSystemStats() {
  const res = await api.get('/admin/stats')
  return res.data?.data || res.data
}

export async function generateSystemReport(params = {}) {
  const res = await api.post('/admin/reports/generate', params)
  return res.data?.data || res.data
}

export async function exportFullBackup() {
  const res = await api.get('/admin/export/all')
  return res.data
}

export async function importFullBackup(payload) {
  const res = await api.post('/admin/import', payload)
  return res.data
}
