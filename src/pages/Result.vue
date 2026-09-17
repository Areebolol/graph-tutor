<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight" style="color: var(--color-text-primary)">答题结果</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">
          来源：{{ sourceLabel }}
        </p>
      </div>
      <div class="flex gap-2">
        <RouterLink to="/quiz" class="btn btn-outline">再练</RouterLink>
        <RouterLink to="/review" class="btn btn-ghost">错题本</RouterLink>
      </div>
    </div>

    <div v-if="!payload" class="surface space-y-3">
      <p class="text-sm" style="color: var(--color-text-secondary)">暂无结果数据，请先完成一次练习或考试。</p>
      <div class="flex gap-2">
        <RouterLink to="/quiz" class="btn btn-primary">去练习</RouterLink>
        <RouterLink to="/exam" class="btn btn-outline">去考试</RouterLink>
      </div>
    </div>

    <template v-else>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="surface text-center">
          <p class="text-2xl font-bold">{{ Math.round((stats.accuracy || 0) * 100) }}%</p>
          <p class="text-xs mt-1" style="color: var(--color-text-secondary)">正确率</p>
        </div>
        <div class="surface text-center">
          <p class="text-2xl font-bold text-green-600">{{ stats.correct }}</p>
          <p class="text-xs mt-1" style="color: var(--color-text-secondary)">正确</p>
        </div>
        <div class="surface text-center">
          <p class="text-2xl font-bold text-red-600">{{ stats.wrong }}</p>
          <p class="text-xs mt-1" style="color: var(--color-text-secondary)">错误</p>
        </div>
        <div class="surface text-center">
          <p class="text-2xl font-bold" style="color: var(--color-text-tertiary)">{{ stats.empty }}</p>
          <p class="text-xs mt-1" style="color: var(--color-text-secondary)">未答</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="f in filters"
          :key="f.key"
          type="button"
          class="btn text-sm"
          :class="filter === f.key ? 'btn-primary' : 'btn-outline'"
          @click="filter = f.key"
        >
          {{ f.label }}
        </button>
      </div>

      <div class="space-y-3">
        <div
          v-for="item in filteredDetails"
          :key="item.questionId"
          class="surface space-y-2"
        >
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="font-semibold">第 {{ item.index + 1 }} 题</span>
            <span
              class="px-2 py-0.5 rounded"
              :class="item.isEmpty ? 'bg-slate-100' : item.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
            >
              {{ item.isEmpty ? '未答' : item.isCorrect ? '正确' : '错误' }}
            </span>
          </div>
          <p class="text-sm font-medium whitespace-pre-wrap">{{ questions[item.index]?.content }}</p>
          <p class="text-sm" style="color: var(--color-text-secondary)">
            你的答案：{{ formatAnswerDisplay(questions[item.index], answers[item.questionId]) }}
          </p>
          <p class="text-sm" style="color: var(--color-text-secondary)">
            正确答案：{{ formatCorrectAnswerDisplay(questions[item.index]) }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuizResultStore } from '../stores/quiz'
import { formatAnswerDisplay, formatCorrectAnswerDisplay } from '../utils/questionScoring'

const resultStore = useQuizResultStore()
const filter = ref('all')

const filters = [
  { key: 'all', label: '全部' },
  { key: 'wrong', label: '错题' },
  { key: 'empty', label: '未答' },
  { key: 'correct', label: '正确' },
]

const payload = computed(() => resultStore.payload)
const stats = computed(() => payload.value?.stats || { correct: 0, wrong: 0, empty: 0, accuracy: 0, details: [] })
const questions = computed(() => payload.value?.questions || [])
const answers = computed(() => payload.value?.answers || {})
const sourceLabel = computed(() => {
  const s = payload.value?.source
  if (s === 'exam') return '考试'
  if (s === 'quiz') return '练习'
  return s || '未知'
})

const filteredDetails = computed(() => {
  const details = stats.value.details || []
  if (filter.value === 'wrong') return details.filter((d) => !d.isCorrect && !d.isEmpty)
  if (filter.value === 'empty') return details.filter((d) => d.isEmpty)
  if (filter.value === 'correct') return details.filter((d) => d.isCorrect)
  return details
})
</script>
