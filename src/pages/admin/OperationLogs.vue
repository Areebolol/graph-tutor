<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">操作日志</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">查看用户操作记录</p>
      </div>
      <RouterLink to="/admin" class="btn btn-ghost">返回后台</RouterLink>
    </div>

    <form class="surface flex flex-wrap gap-3 items-end" @submit.prevent="load">
      <div>
        <label class="label">操作类型</label>
        <input v-model="filters.type" class="input" placeholder="可选" />
      </div>
      <div>
        <label class="label">开始日期</label>
        <input v-model="filters.startDate" type="date" class="input" />
      </div>
      <div>
        <label class="label">结束日期</label>
        <input v-model="filters.endDate" type="date" class="input" />
      </div>
      <button type="submit" class="btn btn-outline">筛选</button>
    </form>

    <div v-if="stats" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="surface text-center">
        <p class="text-xl font-bold">{{ stats.total ?? meta.total ?? '—' }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">总日志</p>
      </div>
      <div class="surface text-center">
        <p class="text-xl font-bold">{{ stats.today ?? '—' }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">今日</p>
      </div>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>
    <div v-else class="surface overflow-x-auto">
      <table class="w-full text-sm text-left">
        <thead>
          <tr style="color: var(--color-text-tertiary)">
            <th class="py-2 pr-3 font-medium">时间</th>
            <th class="py-2 pr-3 font-medium">用户</th>
            <th class="py-2 pr-3 font-medium">类型</th>
            <th class="py-2 font-medium">详情</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log._id" class="border-t" style="border-color: var(--color-border)">
            <td class="py-2 pr-3 whitespace-nowrap">{{ formatDate(log.createdAt) }}</td>
            <td class="py-2 pr-3">{{ log.user?.name || log.user?.email || log.userId || '—' }}</td>
            <td class="py-2 pr-3">{{ log.type || log.action || '—' }}</td>
            <td class="py-2">{{ log.description || log.detail || log.message || '—' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!logs.length" class="text-center text-sm py-6" style="color: var(--color-text-tertiary)">暂无日志</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getOperationLogStats, getUserOperationLogs } from '../../api/users'

const loading = ref(false)
const err = ref('')
const logs = ref([])
const meta = ref({})
const stats = ref(null)
const filters = reactive({ type: '', startDate: '', endDate: '' })

function formatDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleString('zh-CN')
  } catch {
    return String(d)
  }
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const params = {
      type: filters.type || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      limit: 50,
    }
    const [res, st] = await Promise.all([
      getUserOperationLogs(params),
      getOperationLogStats(params).catch(() => null),
    ])
    logs.value = res.data || []
    meta.value = res.meta || {}
    stats.value = st
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    logs.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
