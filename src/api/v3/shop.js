import api from '../api'

export async function getShopItems() {
  const res = await api.get('/v3/shop/items')
  return res.data?.data || res.data || []
}

export async function getInventory() {
  const res = await api.get('/v3/shop/inventory')
  return res.data?.data || res.data || { points: 0, items: [] }
}

export async function purchaseItem(itemId, quantity = 1) {
  const res = await api.post('/v3/shop/purchase', { itemId, quantity })
  if (res.data?.success === false) throw new Error(res.data?.message || '兑换失败')
  return res.data?.data || res.data
}

export async function useShopItem(itemId) {
  const res = await api.post('/v3/shop/use', { itemId })
  if (res.data?.success === false) throw new Error(res.data?.message || '使用失败')
  return res.data?.data || res.data
}
