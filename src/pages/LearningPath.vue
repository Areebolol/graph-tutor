<template>
  <div class="space-y-4 animate-rise-in">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">学习路径</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">
        按知识点掌握度推荐下一步，可指定起点与终点
      </p>
    </div>

    <div class="surface flex flex-wrap gap-3 items-end">
      <label class="text-sm min-w-[140px]">
        <span class="label">起点</span>
        <select v-model="startKey" class="input" @change="buildPath">
          <option value="">自动（薄弱点）</option>
          <option v-for="n in nodes" :key="n.key" :value="n.key">{{ n.name || n.key }}</option>
        </select>
      </label>
      <label class="text-sm min-w-[140px]">
        <span class="label">终点</span>
        <select v-model="endKey" class="input" @change="buildPath">
          <option value="">自动</option>
          <option v-for="n in nodes" :key="n.key" :value="n.key">{{ n.name || n.key }}</option>
        </select>
      </label>
      <button type="button" class="btn btn-outline" @click="load">刷新</button>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>

    <template v-else>
      <div class="surface space-y-3">
        <h2 class="font-semibold">推荐路径</h2>
        <ol class="space-y-2">
          <li
            v-for="(n, i) in path"
            :key="n.key"
            class="flex items-center gap-3 rounded-lg px-3 py-2"
            :style="{ background: n.mastered ? 'var(--color-success-light)' : 'var(--color-bg-secondary)' }"
          >
            <span class="w-6 h-6 rounded-full text-xs flex items-center justify-center font-semibold text-white" style="background: var(--color-primary-deep)">
              {{ i + 1 }}
            </span>
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">{{ n.name || n.key }}</div>
              <div class="text-xs" style="color: var(--color-text-tertiary)">
                掌握度 {{ n.masteryPercent || 0 }}% · {{ n.mastered ? '已掌握' : '待加强' }}
              </div>
            </div>
            <RouterLink :to="`/quiz`" class="btn btn-ghost text-xs shrink-0">去练习</RouterLink>
          </li>
        </ol>
        <p v-if="!path.length" class="text-sm" style="color: var(--color-text-tertiary)">暂无路径，请先有知识点数据</p>
      </div>

      <div class="surface space-y-2">
        <h2 class="font-semibold">下一步建议</h2>
        <div v-for="n in nextItems" :key="n.key" class="flex justify-between gap-3 text-sm border-b py-2" style="border-color: var(--color-border)">
          <span>{{ n.name || n.key }} · {{ n.masteryPercent || 0 }}%</span>
          <span style="color: var(--color-text-tertiary)">{{ n.reason }}</span>
        </div>
        <p v-if="!nextItems.length" class="text-sm" style="color: var(--color-text-tertiary)">暂无建议</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import api from '../api/api'
import { getKnowledgeMastery } from '../api/analytics'
import { listNodes } from '../api/graph'
import toast from '../utils/toast'

const loading = ref(true)
const nodes = ref([])
const path = ref([])
const nextItems = ref([])
const masteryMap = ref({})
const startKey = ref('')
const endKey = ref('')

function pct(n) {
  const m = masteryMap.value[n.key] || {}
  return Math.round(m.masteryPercent ?? m.accuracy ?? 0)
}

function buildPath() {
  if (!nodes.value.length) {
    path.value = []
    return
  }
  let list = [...nodes.value]
  const start = startKey.value
  const end = endKey.value
  if (start) {
    const i = list.findIndex((n) => n.key === start)
    if (i >= 0) list = list.slice(i)
  }
  if (end) {
    const i = list.findIndex((n) => n.key === end)
    if (i >= 0) list = list.slice(0, i + 1)
  }
  path.value = list.map((n) => {
    const masteryPercent = pct(n)
    return { ...n, masteryPercent, mastered: masteryPercent >= 70 }
  })
}

async function load() {
  loading.value = true
  try {
    const [nodeList, mastery, recRes] = await Promise.all([
      listNodes(),
      getKnowledgeMastery({ days: 90 }).catch(() => ({})),
      api.get('/v3/enhanced-analytics/path-recommendations', { params: { limit: 5 } }).catch(() => ({ data: {} })),
    ])
    nodes.value = nodeList || []
    const map = {}
    ;(mastery.knowledgeNodes || []).forEach((n) => {
      map[n.key || n.knowledgeNodeId] = n
    })
    masteryMap.value = map
    const rec = recRes.data?.data || recRes.data || []
    nextItems.value = Array.isArray(rec) ? rec : rec.items || []
    buildPath()
  } catch {
    toast('加载学习路径失败', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
