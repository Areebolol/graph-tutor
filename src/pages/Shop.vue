<template>
  <div class="space-y-4 animate-rise-in">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">成就商城</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">用积分兑换道具，助力学习</p>
    </div>

    <div class="surface flex items-center justify-between">
      <span class="font-medium">我的积分</span>
      <span class="text-2xl font-bold" style="color: var(--color-warning)">{{ inventory.points || 0 }}</span>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else class="space-y-6">
      <div>
        <h2 class="font-semibold mb-3">可兑换商品</h2>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="item in items" :key="item.id" class="surface flex flex-col gap-2">
            <div class="text-3xl">{{ item.icon }}</div>
            <h3 class="font-semibold">{{ item.name }}</h3>
            <p class="text-sm flex-1" style="color: var(--color-text-secondary)">{{ item.description }}</p>
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium" style="color: var(--color-warning)">{{ item.cost }} 积分</span>
              <button
                type="button"
                class="btn btn-primary text-xs"
                :disabled="(inventory.points || 0) < item.cost || buying === item.id"
                @click="buy(item)"
              >
                {{ buying === item.id ? '兑换中…' : '兑换' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 class="font-semibold mb-3">我的背包</h2>
        <div v-if="!(inventory.items || []).length" class="surface text-sm" style="color: var(--color-text-tertiary)">
          暂无道具
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="bag in inventory.items"
            :key="bag.id"
            class="surface flex flex-wrap items-center justify-between gap-3"
          >
            <span>{{ bag.icon }} {{ bag.name }} × {{ bag.quantity }}</span>
            <button type="button" class="btn btn-outline text-xs" :disabled="using === bag.id" @click="useIt(bag)">
              {{ using === bag.id ? '使用中…' : '使用' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getInventory, getShopItems, purchaseItem, useShopItem } from '../api/v3/shop'
import toast from '../utils/toast'

const loading = ref(true)
const items = ref([])
const inventory = ref({ points: 0, items: [] })
const buying = ref('')
const using = ref('')

async function load() {
  loading.value = true
  try {
    const [shop, inv] = await Promise.all([getShopItems(), getInventory()])
    items.value = Array.isArray(shop) ? shop : shop?.items || []
    inventory.value = inv || { points: 0, items: [] }
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

async function buy(item) {
  buying.value = item.id
  try {
    await purchaseItem(item.id, 1)
    toast('兑换成功', 'success')
    await load()
  } catch (e) {
    toast(e.message || '兑换失败', 'error')
  } finally {
    buying.value = ''
  }
}

async function useIt(bag) {
  using.value = bag.id
  try {
    await useShopItem(bag.id)
    toast(`已使用「${bag.name}」`, 'success')
    await load()
  } catch (e) {
    toast(e.message || '使用失败', 'error')
  } finally {
    using.value = ''
  }
}

onMounted(load)
</script>
