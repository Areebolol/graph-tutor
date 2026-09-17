<template>
  <div class="space-y-4 animate-rise-in">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">排行榜</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">按答题量、正确率、连续学习等维度排名</p>
    </div>

    <div class="surface flex flex-wrap gap-3 items-end">
      <label class="text-sm">
        <span class="label">类型</span>
        <select v-model="type" class="input" @change="load">
          <option value="total">总答题</option>
          <option value="questions">做题数</option>
          <option value="accuracy">正确率</option>
          <option value="streak">连续学习</option>
          <option value="weekly">本周</option>
          <option value="monthly">本月</option>
        </select>
      </label>
      <label class="text-sm">
        <span class="label">周期</span>
        <select v-model="period" class="input" @change="load">
          <option value="all">全部</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
        </select>
      </label>
      <button type="button" class="btn btn-outline" :disabled="loading" @click="load">刷新</button>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <div v-else class="surface overflow-x-auto">
      <table class="w-full text-sm min-w-[320px]">
        <thead>
          <tr class="text-left border-b" style="border-color: var(--color-border); color: var(--color-text-secondary)">
            <th class="py-2 pr-3 w-14">#</th>
            <th class="py-2 pr-3">用户</th>
            <th class="py-2 pr-3">{{ valueLabel }}</th>
            <th class="py-2">正确率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in items" :key="row.userId || row._id || i" class="border-b" style="border-color: var(--color-border)">
            <td class="py-2 pr-3 font-semibold">{{ row.rank || i + 1 }}</td>
            <td class="py-2 pr-3">{{ row.name || row.user?.name || row.email || '用户' }}</td>
            <td class="py-2 pr-3">{{ formatValue(row) }}</td>
            <td class="py-2">{{ formatAcc(row.accuracy) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!items.length" class="text-sm py-6 text-center" style="color: var(--color-text-tertiary)">暂无榜单数据</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getLeaderboard } from '../api/v3/leaderboard'

const loading = ref(false)
const err = ref('')
const items = ref([])
const type = ref('total')
const period = ref('week')

const valueLabel = computed(() => {
  if (type.value === 'accuracy') return '正确率'
  if (type.value === 'streak') return '连续天数'
  if (type.value === 'weekly') return '本周答题'
  if (type.value === 'monthly') return '本月答题'
  return '数值'
})

function formatAcc(a) {
  if (a == null) return '—'
  const n = Number(a)
  if (Number.isNaN(n)) return '—'
  return n <= 1 ? `${(n * 100).toFixed(1)}%` : `${n.toFixed(1)}%`
}

function formatValue(row) {
  if (type.value === 'accuracy') return formatAcc(row.accuracy ?? row.value)
  if (type.value === 'streak') return `${row.value ?? row.streak ?? 0} 天`
  return row.value ?? row.total ?? row.score ?? '—'
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const data = await getLeaderboard({ type: type.value, period: period.value, limit: 100 })
    items.value = data?.items || data || []
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
