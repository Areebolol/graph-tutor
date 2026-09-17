<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">题目</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">浏览与管理题目</p>
      </div>
      <RouterLink v-if="canManage" :to="createLink" class="btn btn-primary">新建题目</RouterLink>
    </div>

    <div class="surface flex flex-wrap gap-3 items-end">
      <label class="text-sm flex-1 min-w-[160px]">
        <span class="label">搜索</span>
        <input v-model="search" class="input" placeholder="题干关键词" @keyup.enter="page = 1; load()" />
      </label>
      <label class="text-sm min-w-[140px]">
        <span class="label">学科</span>
        <select v-model="subjectCode" class="input" @change="page = 1; load()">
          <option value="">全部</option>
          <option v-for="s in flatSubjects" :key="s.code" :value="s.code">{{ s.name }}</option>
        </select>
      </label>
      <label class="text-sm min-w-[140px]">
        <span class="label">题库</span>
        <select v-model="bankId" class="input" @change="page = 1; load()">
          <option value="">全部</option>
          <option v-for="b in banks" :key="b._id" :value="b._id">{{ b.name }}</option>
        </select>
      </label>
      <label class="text-sm min-w-[100px]">
        <span class="label">难度</span>
        <select v-model="difficulty" class="input" @change="page = 1; load()">
          <option value="">全部</option>
          <option v-for="d in 5" :key="d" :value="String(d)">{{ d }}</option>
        </select>
      </label>
      <button type="button" class="btn btn-outline" :disabled="loading" @click="load">刷新</button>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <div v-else class="space-y-2">
      <div
        v-for="q in rows"
        :key="q._id"
        class="surface flex flex-wrap items-start justify-between gap-3"
      >
        <RouterLink :to="`/questions/${q._id}/detail`" class="flex-1 min-w-0 space-y-1">
          <p class="text-sm font-medium line-clamp-2">{{ q.content }}</p>
          <p class="text-xs" style="color: var(--color-text-tertiary)">
            {{ typeLabel(q.type) }} · 难度 {{ q.difficulty || '—' }}
            <span v-if="bankName(q)"> · {{ bankName(q) }}</span>
          </p>
        </RouterLink>
        <div v-if="canManage" class="flex gap-2 shrink-0">
          <RouterLink :to="`/questions/${q._id}/edit`" class="btn btn-ghost text-xs">编辑</RouterLink>
          <button type="button" class="btn btn-ghost text-xs text-red-600" @click="onDelete(q)">删除</button>
        </div>
      </div>
      <div v-if="!rows.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">
        暂无题目
      </div>
    </div>

    <div v-if="meta.totalPages > 1" class="flex justify-center gap-2">
      <button type="button" class="btn btn-ghost" :disabled="page <= 1" @click="page--; load()">上一页</button>
      <span class="text-sm self-center">{{ page }} / {{ meta.totalPages }}</span>
      <button type="button" class="btn btn-ghost" :disabled="page >= meta.totalPages" @click="page++; load()">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getBanks } from '../../api/v3/questionBanks'
import { deleteQuestion, getQuestions } from '../../api/v3/questions'
import { getSubjectTree } from '../../api/v3/subjects'
import { useAuthStore } from '../../stores/auth'
import { flattenSubjects } from '../../utils/practiceSubmit'
import { canManageResources } from '../../utils/role'
import toast from '../../utils/toast'

const route = useRoute()
const auth = useAuthStore()
const canManage = computed(() => canManageResources(auth.user))

const loading = ref(false)
const err = ref('')
const rows = ref([])
const page = ref(1)
const search = ref('')
const subjectCode = ref('')
const bankId = ref('')
const difficulty = ref('')
const subjects = ref([])
const banks = ref([])
const meta = reactive({ totalPages: 1 })

const flatSubjects = computed(() => flattenSubjects(subjects.value))
const createLink = computed(() =>
  bankId.value ? `/questions/create?bankId=${bankId.value}` : '/questions/create',
)

function typeLabel(t) {
  return { single: '单选', multiple: '多选', judge: '判断', fill: '填空', short: '简答', coding: '编程' }[t] || t || '—'
}

function bankName(q) {
  const b = q.bankId
  if (!b) return ''
  if (typeof b === 'object') return b.name || ''
  return ''
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const res = await getQuestions({
      page: page.value,
      limit: 20,
      search: search.value || undefined,
      subjectCode: subjectCode.value || undefined,
      bankId: bankId.value || undefined,
      difficulty: difficulty.value || undefined,
    })
    rows.value = res.data || []
    Object.assign(meta, res.meta || {})
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function onDelete(q) {
  if (!confirm('确定删除该题目？')) return
  try {
    await deleteQuestion(q._id)
    toast('已删除', 'success')
    await load()
  } catch (e) {
    toast(e?.message || '删除失败', 'error')
  }
}

watch(
  () => route.query.bankId,
  (v) => {
    if (typeof v === 'string' && v) bankId.value = v
  },
  { immediate: true },
)

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
