<template>
  <div class="space-y-4 animate-rise-in">
    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <template v-else-if="question">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">题目详情</h1>
          <p class="mt-1 text-xs" style="color: var(--color-text-tertiary)">
            {{ typeLabel(question.type) }} · 难度 {{ question.difficulty || '—' }}
            <span v-if="subjectLabel"> · {{ subjectLabel }}</span>
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink to="/questions" class="btn btn-ghost">返回列表</RouterLink>
          <RouterLink v-if="canManage" :to="`/questions/${question._id}/edit`" class="btn btn-primary">编辑</RouterLink>
        </div>
      </div>

      <div class="surface space-y-4">
        <div>
          <h2 class="text-sm font-semibold mb-2">题干</h2>
          <p class="whitespace-pre-wrap">{{ question.content }}</p>
        </div>

        <div v-if="options.length">
          <h2 class="text-sm font-semibold mb-2">选项</h2>
          <ul class="space-y-2">
            <li
              v-for="(opt, i) in options"
              :key="i"
              class="px-3 py-2 rounded-lg border text-sm"
              :class="isCorrectOption(i) ? 'border-green-400 bg-green-50' : ''"
              :style="isCorrectOption(i) ? {} : { borderColor: 'var(--color-border)' }"
            >
              <span class="font-semibold mr-2">{{ String.fromCharCode(65 + i) }}.</span>
              {{ opt }}
            </li>
          </ul>
        </div>

        <div>
          <h2 class="text-sm font-semibold mb-2">答案</h2>
          <p class="text-sm" style="color: var(--color-text-secondary)">{{ answerText }}</p>
        </div>

        <div v-if="question.explain">
          <h2 class="text-sm font-semibold mb-2">解析</h2>
          <p class="text-sm whitespace-pre-wrap" style="color: var(--color-text-secondary)">{{ question.explain }}</p>
        </div>

        <div v-if="question.tags?.length" class="flex flex-wrap gap-2">
          <span
            v-for="tag in question.tags"
            :key="tag"
            class="px-2 py-0.5 rounded text-xs border"
            style="border-color: var(--color-border)"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getQuestion } from '../../api/v3/questions'
import { useAuthStore } from '../../stores/auth'
import { formatCorrectAnswerDisplay } from '../../utils/questionScoring'
import { canManageResources } from '../../utils/role'

const route = useRoute()
const auth = useAuthStore()
const canManage = computed(() => canManageResources(auth.user))

const loading = ref(true)
const err = ref('')
const question = ref(null)

const options = computed(() => {
  const q = question.value
  if (!q) return []
  if (Array.isArray(q.options)) return q.options
  if (Array.isArray(q.choices)) return q.choices
  return []
})

const subjectLabel = computed(() => {
  const s = question.value?.subjectCode
  if (!s) return ''
  if (typeof s === 'string') return s
  return s.name || s.code || ''
})

const answerText = computed(() =>
  question.value ? formatCorrectAnswerDisplay(question.value) : '',
)

function typeLabel(t) {
  return { single: '单选', multiple: '多选', judge: '判断', fill: '填空', short: '简答', coding: '编程' }[t] || t || '—'
}

function isCorrectOption(i) {
  const q = question.value
  if (!q) return false
  if (q.type === 'multiple') {
    const ans = Array.isArray(q.answer) ? q.answer : q.answerIndices || []
    return ans.includes(i)
  }
  const idx = q.answerIndex ?? q.answer
  return typeof idx === 'number' && idx === i
}

onMounted(async () => {
  try {
    question.value = await getQuestion(route.params.id)
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
  } finally {
    loading.value = false
  }
})
</script>
