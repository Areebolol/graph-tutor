<template>
  <div class="space-y-4 animate-rise-in">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">学科技能树</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">
        掌握知识点即可点亮（正确率 ≥70% 且答题 ≥3）
      </p>
    </div>

    <div class="surface flex flex-wrap items-center gap-3">
      <label class="text-sm font-medium">学科</label>
      <select v-model="subjectCode" class="input min-w-[160px]" @change="load">
        <option v-for="s in flatSubjects" :key="s.code" :value="s.code">{{ s.name }}</option>
      </select>
      <span class="text-sm" style="color: var(--color-text-secondary)">
        近 90 天 · 已点亮 {{ litCount }} / {{ nodes.length }}
      </span>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <div v-else-if="!nodes.length" class="surface text-center py-10 text-sm" style="color: var(--color-text-tertiary)">
      该学科暂无知识点数据
    </div>

    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="n in nodes"
        :key="n.key || n.knowledgeNodeId || n.name"
        class="surface space-y-2"
        :class="n.lit ? 'border-green-300' : 'opacity-80'"
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="font-semibold text-sm truncate">{{ n.name || n.key }}</h2>
          <span
            class="text-xs px-2 py-0.5 rounded shrink-0"
            :class="n.lit ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'"
          >
            {{ n.lit ? '已点亮' : '未点亮' }}
          </span>
        </div>
        <p class="text-xs" style="color: var(--color-text-secondary)">
          正确率 {{ pct(n) }}% · 答题 {{ n.practiceCount || n.total || 0 }}
        </p>
        <div class="h-2 rounded-full overflow-hidden" style="background: var(--color-bg-tertiary)">
          <div
            class="h-full rounded-full"
            :style="{
              width: `${pct(n)}%`,
              background: n.lit ? 'var(--color-success)' : 'var(--color-primary)',
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getSkillTree } from '../api/v3/enhancedAnalytics'
import { getSubjectTree } from '../api/v3/subjects'
import { flattenSubjects } from '../utils/practiceSubmit'

const subjects = ref([])
const subjectCode = ref('')
const nodes = ref([])
const loading = ref(false)
const err = ref('')

const flatSubjects = computed(() => flattenSubjects(subjects.value))
const litCount = computed(() => nodes.value.filter((n) => n.lit).length)

function pct(n) {
  const v = n.masteryPercent ?? n.accuracy ?? 0
  const num = Number(v)
  if (num <= 1 && num > 0 && n.masteryPercent == null) return Math.round(num * 100)
  return Math.round(Math.max(0, Math.min(100, num)))
}

async function load() {
  if (!subjectCode.value) return
  loading.value = true
  err.value = ''
  try {
    const res = await getSkillTree(subjectCode.value, 90)
    const data = res?.data ?? res
    nodes.value = data?.nodes || []
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    nodes.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    subjects.value = await getSubjectTree()
    const flat = flattenSubjects(subjects.value)
    if (flat[0]) subjectCode.value = flat[0].code
  } catch {
    subjects.value = []
  }
  await load()
})
</script>
