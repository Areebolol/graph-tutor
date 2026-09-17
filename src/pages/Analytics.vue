<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">学习数据</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">掌握度、趋势与题型分布</p>
      </div>
      <div class="flex flex-wrap gap-2 items-end">
        <label class="text-sm">
          <span class="label">天数</span>
          <select v-model.number="days" class="input w-28" @change="load">
            <option :value="7">7</option>
            <option :value="30">30</option>
            <option :value="90">90</option>
          </select>
        </label>
        <label class="text-sm min-w-[140px]">
          <span class="label">学科</span>
          <select v-model="subjectCode" class="input" @change="load">
            <option value="">全部</option>
            <option v-for="s in flatSubjects" :key="s.code" :value="s.code">{{ s.name }}</option>
          </select>
        </label>
        <button type="button" class="btn btn-outline" :disabled="loading" @click="load">刷新</button>
      </div>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <template v-else-if="mastery">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="surface text-center">
          <p class="text-2xl font-bold text-blue-600">{{ overall.total || 0 }}</p>
          <p class="text-xs mt-1" style="color: var(--color-text-secondary)">总答题</p>
        </div>
        <div class="surface text-center">
          <p class="text-2xl font-bold text-green-600">{{ overall.correct || 0 }}</p>
          <p class="text-xs mt-1" style="color: var(--color-text-secondary)">正确</p>
        </div>
        <div class="surface text-center">
          <p class="text-2xl font-bold text-red-600">{{ overall.wrong || 0 }}</p>
          <p class="text-xs mt-1" style="color: var(--color-text-secondary)">错误</p>
        </div>
        <div class="surface text-center">
          <p class="text-2xl font-bold" style="color: var(--color-primary-deep)">
            {{ Number(overall.accuracy || 0).toFixed(1) }}%
          </p>
          <p class="text-xs mt-1" style="color: var(--color-text-secondary)">正确率</p>
        </div>
      </div>

      <div class="surface space-y-3">
        <h2 class="font-semibold">知识点掌握度</h2>
        <div v-if="!nodes.length" class="text-sm" style="color: var(--color-text-tertiary)">暂无数据</div>
        <div v-for="n in nodes.slice(0, 20)" :key="n.key || n.knowledgeNodeId || n.name" class="space-y-1">
          <div class="flex justify-between text-sm gap-2">
            <span class="truncate">{{ n.name || n.key || n.knowledgeNodeId }}</span>
            <span class="shrink-0" style="color: var(--color-text-secondary)">
              {{ masteryPct(n) }}% · {{ n.total || n.practiceCount || 0 }} 题
            </span>
          </div>
          <div class="h-2 rounded-full overflow-hidden" style="background: var(--color-bg-tertiary)">
            <div class="h-full rounded-full" style="background: var(--color-primary)" :style="{ width: `${masteryPct(n)}%` }" />
          </div>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <div class="surface space-y-2">
          <h2 class="font-semibold">按学科</h2>
          <table class="w-full text-sm">
            <tbody>
              <tr v-for="row in bySubject" :key="row.subjectCode || row.name" class="border-b" style="border-color: var(--color-border)">
                <td class="py-2">{{ row.name || row.subjectCode || '—' }}</td>
                <td class="py-2 text-right">{{ Number(row.accuracy || 0).toFixed(1) }}%</td>
                <td class="py-2 text-right w-16" style="color: var(--color-text-tertiary)">{{ row.total || 0 }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="!bySubject.length" class="text-sm" style="color: var(--color-text-tertiary)">暂无</p>
        </div>
        <div class="surface space-y-2">
          <h2 class="font-semibold">按题型</h2>
          <table class="w-full text-sm">
            <tbody>
              <tr v-for="row in byType" :key="row.type || row.name" class="border-b" style="border-color: var(--color-border)">
                <td class="py-2">{{ typeLabel(row.type || row.name) }}</td>
                <td class="py-2 text-right">{{ Number(row.accuracy || 0).toFixed(1) }}%</td>
                <td class="py-2 text-right w-16" style="color: var(--color-text-tertiary)">{{ row.total || 0 }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="!byType.length" class="text-sm" style="color: var(--color-text-tertiary)">暂无</p>
        </div>
      </div>

      <div class="surface space-y-2 overflow-x-auto">
        <h2 class="font-semibold">学习趋势</h2>
        <table class="w-full text-sm min-w-[320px]">
          <thead>
            <tr class="text-left border-b" style="border-color: var(--color-border); color: var(--color-text-secondary)">
              <th class="py-2 pr-3">日期</th>
              <th class="py-2 pr-3">答题</th>
              <th class="py-2 pr-3">正确</th>
              <th class="py-2">正确率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in trendRows" :key="i" class="border-b" style="border-color: var(--color-border)">
              <td class="py-2 pr-3">{{ row.date || row.day || '—' }}</td>
              <td class="py-2 pr-3">{{ row.total ?? row.count ?? 0 }}</td>
              <td class="py-2 pr-3">{{ row.correct ?? 0 }}</td>
              <td class="py-2">{{ formatTrendAcc(row) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!trendRows.length" class="text-sm" style="color: var(--color-text-tertiary)">暂无趋势数据</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getKnowledgeMastery, getLearningTrend } from '../api/analytics'
import { getSubjectTree } from '../api/v3/subjects'
import { flattenSubjects } from '../utils/practiceSubmit'

const loading = ref(false)
const err = ref('')
const days = ref(30)
const subjectCode = ref('')
const subjects = ref([])
const mastery = ref(null)
const trend = ref([])

const flatSubjects = computed(() => flattenSubjects(subjects.value))
const overall = computed(() => mastery.value?.overall || {})
const nodes = computed(() => mastery.value?.knowledgeNodes || [])
const bySubject = computed(() => mastery.value?.bySubject || [])
const byType = computed(() => mastery.value?.byType || [])
const trendRows = computed(() => (Array.isArray(trend.value) ? trend.value : trend.value?.items || []))

function masteryPct(n) {
  const v = n.masteryPercent ?? n.accuracy ?? n.mastery ?? 0
  const num = Number(v)
  if (num <= 1 && num > 0 && !n.masteryPercent) return Math.round(num * 100)
  return Math.round(Math.max(0, Math.min(100, num)))
}

function typeLabel(t) {
  return { single: '单选', multiple: '多选', judge: '判断', fill: '填空', short: '简答', coding: '编程' }[t] || t || '—'
}

function formatTrendAcc(row) {
  if (row.accuracy != null) {
    const a = Number(row.accuracy)
    return a <= 1 ? `${(a * 100).toFixed(1)}%` : `${a.toFixed(1)}%`
  }
  const total = row.total ?? row.count ?? 0
  const correct = row.correct ?? 0
  if (!total) return '—'
  return `${((correct / total) * 100).toFixed(1)}%`
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const [m, t] = await Promise.all([
      getKnowledgeMastery({ days: days.value, subjectCode: subjectCode.value || undefined }),
      getLearningTrend({ days: days.value }),
    ])
    mastery.value = m
    trend.value = t || []
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    mastery.value = null
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    subjects.value = await getSubjectTree()
  } catch {
    subjects.value = []
  }
  await load()
})
</script>
