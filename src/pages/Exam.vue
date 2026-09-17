<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight" style="color: var(--color-text-primary)">考试</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">限时作答，交卷后可查看详细结果</p>
      </div>
      <div v-if="step === 'exam'" class="text-lg font-mono font-semibold" :class="remainSec < 60 ? 'text-red-600' : ''">
        {{ timerText }}
      </div>
    </div>

    <!-- 配置 -->
    <div v-if="step === 'config'" class="surface space-y-4 max-w-xl">
      <label class="block">
        <span class="label">题目数量</span>
        <input v-model.number="questionCount" type="number" min="5" max="100" class="input" />
      </label>
      <label class="block">
        <span class="label">时长（分钟）</span>
        <input v-model.number="durationMin" type="number" min="5" max="180" class="input" />
      </label>
      <label class="block">
        <span class="label">学科</span>
        <select v-model="subjectCode" class="input">
          <option value="">全部</option>
          <option v-for="s in flatSubjects" :key="s.code" :value="s.code">{{ s.name }}</option>
        </select>
      </label>
      <label class="block">
        <span class="label">题库</span>
        <select v-model="bankId" class="input">
          <option value="">全部</option>
          <option v-for="b in banks" :key="b._id" :value="b._id">{{ b.name }}</option>
        </select>
      </label>
      <div v-if="err" class="text-sm text-red-600">{{ err }}</div>
      <button type="button" class="btn btn-primary" :disabled="starting" @click="startExam">
        {{ starting ? '准备中…' : '开始考试' }}
      </button>
    </div>

    <!-- 作答 -->
    <template v-else-if="step === 'exam'">
      <div class="surface space-y-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(q, i) in questions"
            :key="qidOf(q, i)"
            type="button"
            class="w-9 h-9 rounded-lg text-xs font-semibold border"
            :class="sheetClass(i)"
            @click="idx = i"
          >
            {{ i + 1 }}
          </button>
        </div>
      </div>

      <div class="surface space-y-4">
        <QuestionPlayer v-model="currentAnswer" :question="current" :index="idx" :total="questions.length" />
        <div class="flex flex-wrap justify-between gap-2">
          <button type="button" class="btn btn-ghost" :disabled="idx <= 0" @click="idx--">上一题</button>
          <div class="flex gap-2">
            <button
              v-if="idx < questions.length - 1"
              type="button"
              class="btn btn-outline"
              @click="idx++"
            >
              下一题
            </button>
            <button type="button" class="btn btn-primary" :disabled="submitting" @click="submitExam(false)">
              {{ submitting ? '提交中…' : '交卷' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- 简要结果 -->
    <div v-else class="surface space-y-4 text-center">
      <p class="text-3xl font-bold" style="color: var(--color-primary-deep)">{{ score }}%</p>
      <p class="text-sm" style="color: var(--color-text-secondary)">
        正确 {{ lastStats?.correct || 0 }} / {{ lastStats?.total || 0 }}
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <button type="button" class="btn btn-primary" @click="goResult">查看详细结果</button>
        <button type="button" class="btn btn-outline" @click="reset">再考一次</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import QuestionPlayer from '../components/QuestionPlayer.vue'
import { listQuestions } from '../api/questions'
import { getBanks } from '../api/v3/questionBanks'
import { getSubjectTree } from '../api/v3/subjects'
import { useAuthStore } from '../stores/auth'
import { useQuizResultStore } from '../stores/quiz'
import { flattenSubjects, qidOf, submitPracticeRecords } from '../utils/practiceSubmit'
import { batchCheckAnswers } from '../utils/questionScoring'
import toast from '../utils/toast'

const auth = useAuthStore()
const resultStore = useQuizResultStore()
const router = useRouter()

const step = ref('config')
const questionCount = ref(20)
const durationMin = ref(30)
const subjectCode = ref('')
const bankId = ref('')
const subjects = ref([])
const banks = ref([])
const questions = ref([])
const answers = ref({})
const idx = ref(0)
const err = ref('')
const starting = ref(false)
const submitting = ref(false)
const score = ref(0)
const lastStats = ref(null)
const remainSec = ref(0)
let timerId = null

const flatSubjects = computed(() => flattenSubjects(subjects.value))
const current = computed(() => questions.value[idx.value] || null)
const currentAnswer = computed({
  get() {
    if (!current.value) return null
    return answers.value[qidOf(current.value, idx.value)] ?? null
  },
  set(v) {
    if (!current.value) return
    answers.value = { ...answers.value, [qidOf(current.value, idx.value)]: v }
  },
})

const timerText = computed(() => {
  const m = Math.floor(remainSec.value / 60)
  const s = remainSec.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function sheetClass(i) {
  const q = questions.value[i]
  const answered = answers.value[qidOf(q, i)] != null && answers.value[qidOf(q, i)] !== ''
  if (i === idx.value) return 'border-blue-500 bg-blue-50'
  if (answered) return 'border-green-400 bg-green-50'
  return ''
}

function clearTimer() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

async function startExam() {
  starting.value = true
  err.value = ''
  try {
    const params = {
      limit: questionCount.value,
      random: 'true',
    }
    if (subjectCode.value) params.subjectCode = subjectCode.value
    if (bankId.value) params.bankId = bankId.value
    const list = await listQuestions(params)
    if (!list.length) {
      err.value = '没有拿到题目，请调整筛选条件'
      return
    }
    questions.value = list
    answers.value = {}
    idx.value = 0
    remainSec.value = Math.max(1, durationMin.value) * 60
    step.value = 'exam'
    clearTimer()
    timerId = setInterval(() => {
      remainSec.value -= 1
      if (remainSec.value <= 0) {
        clearTimer()
        submitExam(true)
      }
    }, 1000)
  } catch (e) {
    err.value = e?.message || '开始失败'
  } finally {
    starting.value = false
  }
}

async function submitExam(auto = false) {
  if (submitting.value || step.value !== 'exam') return
  if (!auto && !confirm('确认交卷？')) return
  submitting.value = true
  clearTimer()
  try {
    const stats = batchCheckAnswers(questions.value, answers.value)
    lastStats.value = stats
    score.value = Math.round(stats.accuracy * 100)
    if (auth.isAuthenticated) {
      await submitPracticeRecords(auth.user, questions.value, answers.value, 'exam')
    }
    step.value = 'result'
    toast(auto ? '时间到，已自动交卷' : '交卷完成', 'success')
  } catch (e) {
    toast(e?.message || '交卷失败', 'error')
  } finally {
    submitting.value = false
  }
}

function goResult() {
  resultStore.setResult({
    stats: lastStats.value,
    questions: questions.value,
    answers: answers.value,
    source: 'exam',
  })
  router.push('/result')
}

function reset() {
  clearTimer()
  step.value = 'config'
  questions.value = []
  answers.value = {}
  lastStats.value = null
}

onMounted(async () => {
  try {
    subjects.value = await getSubjectTree()
  } catch {
    subjects.value = []
  }
  try {
    banks.value = (await getBanks({ limit: 100 })).data || []
  } catch {
    banks.value = []
  }
})

onUnmounted(clearTimer)
</script>
