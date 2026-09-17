<template>
  <div class="space-y-4 animate-rise-in">
    <div>
      <h1 class="text-2xl font-bold tracking-tight" style="color: var(--color-text-primary)">练习</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">
        {{
          practiceSource === 'review'
            ? '来自错题本 / 复习计划的题目'
            : '选择题库与数量后开始；错题会进入错题本'
        }}
      </p>
    </div>

    <div class="surface space-y-3">
      <div v-if="fixedIds?.length" class="text-sm" style="color: var(--color-primary-deep)">
        固定练习（共 {{ fixedIds.length }} 题）
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 text-sm">
          <span class="font-semibold">数量</span>
          <input
            v-model.number="questionCount"
            type="number"
            min="1"
            max="200"
            class="input w-20"
            :disabled="loading || finished || !!fixedIds?.length"
          />
        </label>
        <label class="flex items-center gap-2 text-sm min-w-[140px]">
          <span class="font-semibold shrink-0">学科</span>
          <select v-model="subjectCode" class="input" :disabled="loading || finished || !!fixedIds?.length">
            <option value="">全部</option>
            <option v-for="s in flatSubjects" :key="s.code" :value="s.code">
              {{ s.name }}
            </option>
          </select>
        </label>
        <label class="flex items-center gap-2 text-sm min-w-[140px]">
          <span class="font-semibold shrink-0">题库</span>
          <select v-model="bankId" class="input" :disabled="loading || finished || !!fixedIds?.length">
            <option value="">全部</option>
            <option v-for="b in banks" :key="b._id" :value="b._id">
              {{ b.name }} ({{ b.questionCount || 0 }})
            </option>
          </select>
        </label>
        <button type="button" class="btn btn-ghost text-sm" :disabled="loading || !!fixedIds?.length" @click="reload">
          重新加载
        </button>
      </div>
    </div>

    <div v-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
      {{ err }}
    </div>
    <div v-if="submitErr" class="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
      {{ submitErr }}
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载题目中…</div>

    <template v-else-if="finished">
      <div class="surface space-y-4 text-center">
        <p class="text-3xl font-bold" style="color: var(--color-primary-deep)">{{ score }}%</p>
        <p class="text-sm" style="color: var(--color-text-secondary)">练习完成</p>
        <div class="flex flex-wrap justify-center gap-3">
          <button type="button" class="btn btn-primary" @click="goResult">查看详细结果</button>
          <button type="button" class="btn btn-outline" @click="reload">再练一套</button>
        </div>
      </div>
    </template>

    <template v-else-if="current">
      <div class="surface space-y-4">
        <div class="h-2 rounded-full overflow-hidden" style="background: var(--color-bg-tertiary)">
          <div
            class="h-full transition-all"
            style="background: var(--color-primary)"
            :style="{ width: `${((idx + 1) / Math.max(total, 1)) * 100}%` }"
          />
        </div>

        <QuestionPlayer
          v-model="currentAnswer"
          :question="current"
          :index="idx"
          :total="total"
        />

        <div class="flex flex-wrap gap-2 justify-between pt-2">
          <button type="button" class="btn btn-ghost" :disabled="idx <= 0" @click="idx--">上一题</button>
          <div class="flex gap-2">
            <button v-if="idx < total - 1" type="button" class="btn btn-outline" @click="idx++">下一题</button>
            <button type="button" class="btn btn-primary" :disabled="loadingSubmit" @click="handleSubmit">
              {{ loadingSubmit ? '提交中…' : '交卷' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="surface text-sm" style="color: var(--color-text-secondary)">
      暂无题目，请调整筛选条件后重新加载。
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import QuestionPlayer from '../components/QuestionPlayer.vue'
import { listQuestions } from '../api/questions'
import { getBanks } from '../api/v3/questionBanks'
import { getSubjectTree } from '../api/v3/subjects'
import { useAuthStore } from '../stores/auth'
import { usePracticeLaunchStore, useQuizResultStore } from '../stores/quiz'
import { flattenSubjects, qidOf, submitPracticeRecords } from '../utils/practiceSubmit'
import { batchCheckAnswers } from '../utils/questionScoring'
import toast from '../utils/toast'

const auth = useAuthStore()
const resultStore = useQuizResultStore()
const launchStore = usePracticeLaunchStore()
const router = useRouter()

const loading = ref(false)
const loadingSubmit = ref(false)
const questions = ref([])
const idx = ref(0)
const answers = ref({})
const err = ref('')
const submitErr = ref('')
const finished = ref(false)
const score = ref(null)
const lastStats = ref(null)
const questionCount = ref(20)
const subjectCode = ref('')
const subjects = ref([])
const bankId = ref('')
const banks = ref([])
const fixedIds = ref(null)
const practiceSource = ref(null)

const flatSubjects = computed(() => flattenSubjects(subjects.value))
const total = computed(() => questions.value.length)
const current = computed(() => questions.value[idx.value] || null)
const currentAnswer = computed({
  get() {
    if (!current.value) return null
    return answers.value[qidOf(current.value, idx.value)] ?? null
  },
  set(v) {
    if (!current.value) return
    const id = qidOf(current.value, idx.value)
    answers.value = { ...answers.value, [id]: v }
  },
})

async function loadMeta() {
  try {
    subjects.value = await getSubjectTree()
  } catch {
    subjects.value = []
  }
  try {
    const res = await getBanks({ limit: 100 })
    banks.value = res.data || []
  } catch {
    banks.value = []
  }
}

async function loadQuestions() {
  loading.value = true
  err.value = ''
  finished.value = false
  score.value = null
  lastStats.value = null
  try {
    const params = {}
    if (fixedIds.value?.length) {
      params.ids = fixedIds.value.slice(0, 200).join(',')
    } else {
      params.limit = questionCount.value
      params.random = 'true'
      if (subjectCode.value) params.subjectCode = subjectCode.value
      if (bankId.value) params.bankId = bankId.value
    }
    let list = await listQuestions(params)
    if (fixedIds.value?.length) {
      const byId = new Map(list.map((q) => [String(q._id || q.id), q]))
      const preferred = fixedIds.value.map((id) => byId.get(String(id))).filter(Boolean)
      list = preferred.length ? preferred : list
    } else {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[list[i], list[j]] = [list[j], list[i]]
      }
    }
    questions.value = list
    answers.value = {}
    idx.value = 0
  } catch (e) {
    console.error(e)
    err.value = '获取题目失败。'
    questions.value = []
  } finally {
    loading.value = false
  }
}

function reload() {
  if (!fixedIds.value?.length) {
    // keep filters
  }
  loadQuestions()
}

async function handleSubmit() {
  if (!questions.value.length) return
  loadingSubmit.value = true
  submitErr.value = ''
  try {
    const stats = batchCheckAnswers(questions.value, answers.value)
    lastStats.value = stats
    score.value = Math.round(stats.accuracy * 100)
    finished.value = true

    if (auth.isAuthenticated) {
      await submitPracticeRecords(auth.user, questions.value, answers.value, 'quiz')
    } else {
      submitErr.value = '未登录：成绩仅本地显示，未写入记录。'
    }
    toast('交卷完成', 'success')
  } catch (e) {
    submitErr.value = e?.message || '提交失败'
  } finally {
    loadingSubmit.value = false
  }
}

function goResult() {
  resultStore.setResult({
    stats: lastStats.value || batchCheckAnswers(questions.value, answers.value),
    questions: questions.value,
    answers: answers.value,
    source: 'quiz',
  })
  router.push('/result')
}

watch([questionCount, subjectCode, bankId], () => {
  if (!fixedIds.value?.length && !finished.value) {
    // debounce-ish: only reload when config changes after mount via explicit reload preferred
  }
})

onMounted(async () => {
  const launched = launchStore.consume()
  if (launched.questionIds?.length) {
    fixedIds.value = launched.questionIds
    practiceSource.value = launched.source
  }
  await loadMeta()
  await loadQuestions()
})
</script>
