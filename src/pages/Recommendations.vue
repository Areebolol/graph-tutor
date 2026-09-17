<template>
  <div class="space-y-4 animate-rise-in">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">智能推荐</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">按策略推荐题目，可一键开练</p>
    </div>

    <div class="surface flex flex-wrap gap-3 items-end">
      <label class="text-sm">
        <span class="label">策略</span>
        <select v-model="filters.strategy" class="input" @change="load">
          <option value="adaptive">自适应</option>
          <option value="weakness">薄弱点</option>
          <option value="random">随机</option>
        </select>
      </label>
      <label class="text-sm min-w-[140px]">
        <span class="label">学科</span>
        <select v-model="filters.subjectCode" class="input" @change="load">
          <option value="">全部</option>
          <option v-for="s in flatSubjects" :key="s.code" :value="s.code">{{ s.name }}</option>
        </select>
      </label>
      <label class="text-sm min-w-[140px]">
        <span class="label">题库</span>
        <select v-model="filters.bankId" class="input" @change="load">
          <option value="">全部</option>
          <option v-for="b in banks" :key="b._id" :value="b._id">{{ b.name }}</option>
        </select>
      </label>
      <button type="button" class="btn btn-outline" :disabled="loading" @click="load">刷新</button>
      <button type="button" class="btn btn-primary" :disabled="!ids.length" @click="practiceAll">
        练习推荐（{{ ids.length }}）
      </button>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <div v-else class="space-y-2">
      <div v-for="q in questions" :key="q._id || q.id" class="surface flex flex-wrap justify-between gap-3">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium line-clamp-2">{{ q.content }}</p>
          <p class="text-xs mt-1" style="color: var(--color-text-tertiary)">
            {{ typeLabel(q.type) }} · 难度 {{ q.difficulty || '—' }}
            <span v-if="q.reason"> · {{ q.reason }}</span>
          </p>
        </div>
        <button type="button" class="btn btn-outline text-xs shrink-0" @click="practiceOne(q)">练习</button>
      </div>
      <div v-if="!questions.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">
        暂无推荐，先去练习积累数据
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getBanks } from '../api/v3/questionBanks'
import { getRecommendedQuestions } from '../api/v3/recommendations'
import { getSubjectTree } from '../api/v3/subjects'
import { usePracticeLaunchStore } from '../stores/quiz'
import { flattenSubjects } from '../utils/practiceSubmit'
import toast from '../utils/toast'

const router = useRouter()
const launchStore = usePracticeLaunchStore()

const loading = ref(false)
const err = ref('')
const questions = ref([])
const subjects = ref([])
const banks = ref([])
const filters = reactive({
  strategy: 'adaptive',
  subjectCode: '',
  bankId: '',
  limit: 10,
})

const flatSubjects = computed(() => flattenSubjects(subjects.value))
const ids = computed(() =>
  questions.value.map((q) => String(q._id || q.id)).filter(Boolean),
)

function typeLabel(t) {
  return { single: '单选', multiple: '多选', judge: '判断', fill: '填空', short: '简答' }[t] || t || '—'
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const data = await getRecommendedQuestions({
      ...filters,
      subjectCode: filters.subjectCode || undefined,
      bankId: filters.bankId || undefined,
      includeReasons: false,
    })
    questions.value = Array.isArray(data) ? data : data?.items || data?.questions || []
  } catch (e) {
    err.value = e.message || '加载失败'
    questions.value = []
  } finally {
    loading.value = false
  }
}

function practiceOne(q) {
  const id = q._id || q.id
  if (!id) return
  launchStore.launch([String(id)], 'ai')
  router.push('/quiz')
}

function practiceAll() {
  if (!ids.value.length) return
  launchStore.launch(ids.value, 'ai')
  router.push('/quiz')
  toast('已载入推荐题目', 'success')
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
  await load()
})
</script>
