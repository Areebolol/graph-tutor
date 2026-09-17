<template>
  <div class="space-y-4 animate-rise-in max-w-2xl">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">AI 出题</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">按学科同步生成题目（需出题负责人或管理员）</p>
    </div>

    <form class="surface space-y-4" @submit.prevent="generate">
      <div>
        <label class="label">学科 *</label>
        <select v-model="config.subjectCode" class="input" required>
          <option value="" disabled>请选择</option>
          <option v-for="s in flatSubjects" :key="s.code" :value="s.code">{{ s.name }}</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">难度</label>
          <select v-model.number="config.difficulty" class="input">
            <option v-for="d in 5" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
        <div>
          <label class="label">数量</label>
          <input v-model.number="config.count" type="number" min="1" max="20" class="input" />
        </div>
      </div>
      <div>
        <label class="label">题型</label>
        <select v-model="config.type" class="input">
          <option value="single">单选</option>
          <option value="judge">判断</option>
          <option value="multiple">多选</option>
          <option value="fill">填空</option>
          <option value="short">简答</option>
        </select>
      </div>
      <div>
        <label class="label">知识点提示（可选）</label>
        <input v-model="config.topic" class="input" placeholder="例如：进程与线程" />
      </div>
      <div v-if="error" class="text-sm text-red-600">{{ error }}</div>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? '生成中…' : '生成题目' }}
      </button>
    </form>

    <div v-if="questions.length" class="space-y-3">
      <h2 class="font-semibold">生成结果（{{ questions.length }}）</h2>
      <div v-for="(q, i) in questions" :key="i" class="surface space-y-2">
        <p class="text-sm font-medium whitespace-pre-wrap">{{ i + 1 }}. {{ q.content }}</p>
        <ul v-if="q.options?.length" class="text-sm space-y-1" style="color: var(--color-text-secondary)">
          <li v-for="(opt, j) in q.options" :key="j">
            {{ String.fromCharCode(65 + j) }}. {{ opt }}
          </li>
        </ul>
        <p class="text-xs" style="color: var(--color-text-tertiary)">
          答案：{{ formatAnswer(q) }} · 难度 {{ q.difficulty || config.difficulty }}
        </p>
      </div>
      <p class="text-xs" style="color: var(--color-text-secondary)">
        题目已由后端按配置生成；如需入库请到题目管理中确认或使用完整 AI 控制台。
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { generateQuestions } from '../../api/v3/ai'
import { getSubjectTree } from '../../api/v3/subjects'
import { flattenSubjects } from '../../utils/practiceSubmit'
import toast from '../../utils/toast'

const subjects = ref([])
const flatSubjects = computed(() => flattenSubjects(subjects.value))
const loading = ref(false)
const error = ref('')
const questions = ref([])

const config = reactive({
  subjectCode: '',
  difficulty: 3,
  count: 5,
  type: 'single',
  topic: '',
})

function formatAnswer(q) {
  if (Array.isArray(q.answer)) return q.answer.join(', ')
  if (typeof q.answerIndex === 'number') return String.fromCharCode(65 + q.answerIndex)
  return q.answer ?? '—'
}

async function generate() {
  error.value = ''
  if (!config.subjectCode) {
    error.value = '请选择学科'
    return
  }
  loading.value = true
  try {
    const payload = {
      subjectCode: config.subjectCode,
      difficulty: config.difficulty,
      count: config.count,
      type: config.type,
    }
    if (config.topic.trim()) payload.topic = config.topic.trim()
    const result = await generateQuestions(payload, false)
    questions.value = result?.questions || result?.items || (Array.isArray(result) ? result : [])
    toast(`已生成 ${questions.value.length} 题`, 'success')
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || '生成失败'
    questions.value = []
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
})
</script>
