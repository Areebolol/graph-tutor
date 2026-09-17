<template>
  <div v-if="question" class="space-y-4">
    <div class="flex flex-wrap items-center gap-2 text-xs" style="color: var(--color-text-secondary)">
      <span>第 {{ index + 1 }} / {{ total }} 题</span>
      <span class="px-2 py-0.5 rounded border" style="border-color: var(--color-border)">
        {{ typeLabel }}
      </span>
      <span v-if="question.difficulty" class="px-2 py-0.5 rounded border" style="border-color: var(--color-border)">
        难度 {{ question.difficulty }}
      </span>
    </div>

    <div class="text-base font-medium whitespace-pre-wrap" style="color: var(--color-text-primary)">
      {{ question.content || question.title || '（无题干）' }}
    </div>

    <!-- 单选 / 判断 -->
    <div v-if="isChoiceSingle" class="space-y-2">
      <button
        v-for="(opt, i) in options"
        :key="i"
        type="button"
        class="w-full text-left px-4 py-3 rounded-xl border transition-colors"
        :class="modelValue === i ? 'border-blue-500 bg-blue-50' : ''"
        :style="modelValue === i ? {} : { borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)' }"
        @click="emit('update:modelValue', i)"
      >
        <span class="font-semibold mr-2">{{ String.fromCharCode(65 + i) }}.</span>
        {{ opt }}
      </button>
    </div>

    <!-- 多选 -->
    <div v-else-if="questionType === 'multiple'" class="space-y-2">
      <button
        v-for="(opt, i) in options"
        :key="i"
        type="button"
        class="w-full text-left px-4 py-3 rounded-xl border transition-colors"
        :class="isMultiSelected(i) ? 'border-blue-500 bg-blue-50' : ''"
        :style="isMultiSelected(i) ? {} : { borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)' }"
        @click="toggleMulti(i)"
      >
        <span class="font-semibold mr-2">{{ String.fromCharCode(65 + i) }}.</span>
        {{ opt }}
      </button>
      <p class="text-xs" style="color: var(--color-text-tertiary)">可多选</p>
    </div>

    <!-- 填空 -->
    <div v-else-if="questionType === 'fill'" class="space-y-2">
      <div v-for="(_, i) in blankCount" :key="i">
        <label class="label">空白 {{ i + 1 }}</label>
        <input
          class="input"
          :value="Array.isArray(modelValue) ? modelValue[i] || '' : ''"
          @input="updateBlank(i, $event.target.value)"
        />
      </div>
    </div>

    <!-- 简答 / 编程 -->
    <div v-else>
      <label class="label">{{ questionType === 'coding' ? '代码' : '作答' }}</label>
      <textarea
        class="input min-h-[140px] font-mono text-sm"
        :value="typeof modelValue === 'string' ? modelValue : ''"
        :placeholder="questionType === 'coding' ? '在此填写代码…' : '在此填写答案…'"
        @input="emit('update:modelValue', $event.target.value)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  question: { type: Object, default: null },
  modelValue: { default: null },
  index: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue'])

const questionType = computed(() => props.question?.type || 'single')
const isChoiceSingle = computed(() => ['single', 'judge'].includes(questionType.value))

const typeLabel = computed(() => {
  const map = {
    single: '单选',
    judge: '判断',
    multiple: '多选',
    fill: '填空',
    short: '简答',
    coding: '编程',
  }
  return map[questionType.value] || questionType.value
})

const options = computed(() => {
  const q = props.question
  if (!q) return []
  if (Array.isArray(q.options)) return q.options
  if (Array.isArray(q.choices)) return q.choices
  if (questionType.value === 'judge') return ['正确', '错误']
  return []
})

const blankCount = computed(() => {
  const q = props.question
  const blanks = q?.blankAnswers || q?.answer
  if (Array.isArray(blanks) && blanks.length) return blanks.length
  return 1
})

function isMultiSelected(i) {
  return Array.isArray(props.modelValue) && props.modelValue.includes(i)
}

function toggleMulti(i) {
  const cur = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  const pos = cur.indexOf(i)
  if (pos >= 0) cur.splice(pos, 1)
  else cur.push(i)
  cur.sort((a, b) => a - b)
  emit('update:modelValue', cur)
}

function updateBlank(i, value) {
  const next = Array.isArray(props.modelValue) ? [...props.modelValue] : Array(blankCount.value).fill('')
  while (next.length < blankCount.value) next.push('')
  next[i] = value
  emit('update:modelValue', next)
}
</script>
