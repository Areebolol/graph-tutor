import api from './api'

export async function submitRecord(payload) {
  const res = await api.post('/records', payload)
  return res.data
}

export async function batchSubmitRecords(payload) {
  const res = await api.post('/records/batch', payload)
  return res.data
}

export async function getWrongRecords(userId) {
  const res = await api.get(`/records/wrong?userId=${encodeURIComponent(userId)}`)
  return res.data
}
