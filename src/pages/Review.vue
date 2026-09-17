<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight" style="color: var(--color-text-primary)">错题本</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">复习错题，标记掌握后可再次练习</p>
      </div>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="!selectedIds.length"
        @click="practiceSelected"
      >
        练习选中（{{ selectedIds.length }}）
      </button>
    </div>

    <div v-if="stats" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="surface text-center">
        <p class="text-xl font-bold">{{ stats.total ?? rows.length }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">错题总数</p>
      </div>
      <div class="surface text-center">
        <p class="text-xl font-bold text-green-600">{{ stats.mastered ?? '—' }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">已掌握</p>
      </div>
      <div class="surface text-center">
        <p class="text-xl font-bold text-amber-600">{{ stats.unmastered ?? '—' }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">未掌握</p>
      </div>
      <div class="surface text-center">
        <p class="text-xl font-bold">{{ meta.total || 0 }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">当前筛选</p>
      </div>
    </div>

    <div class="surface flex flex-wrap gap-3 items-end">
      <label class="text-sm">
        <span class="label">掌握状态</span>
        <select v-model="masteryStatus" class="input" @change="page = 1; load()">
          <option value="">全部</option>
          <option value="unmastered">未掌握</option>
          <option value="mastered">已掌握</option>
        </select>
      </label>
      <label class="text-sm flex-1 min-w-[160px]">
        <span class="label">搜索</span>
        <input v-model="searchKeyword" class="input" placeholder="题干关键词" @keyup.enter="page = 1; load()" />
      </label>
      <button type="button" class="btn btn-outline" :disabled="loading" @click="load">刷新</button>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <div v-else class="space-y-3">
      <div v-for="row in rows" :key="rowId(row)" class="surface space-y-2">
        <div class="flex items-start gap-3">
          <input
            type="checkbox"
            class="mt-1"
            :checked="selectedIds.includes(questionIdOf(row))"
            @change="toggleSelect(questionIdOf(row), $event.target.checked)"
          />
          <div class="flex-1 min-w-0 space-y-2">
            <div class="flex flex-wrap gap-2 text-xs">
              <span
                class="px-2 py-0.5 rounded"
                :class="row.masteryStatus === 'mastered' || row.isMastered ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'"
              >
                {{ row.masteryStatus === 'mastered' || row.isMastered ? '已掌握' : '未掌握' }}
              </span>
              <span v-if="row.wrongCount" style="color: var(--color-text-secondary)">错 {{ row.wrongCount }} 次</span>
            </div>
            <p class="text-sm font-medium whitespace-pre-wrap">
              {{ row.question?.content || row.content || row.questionContent || '（无题干）' }}
            </p>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn btn-ghost text-xs" @click="toggleMaster(row)">
                {{ row.masteryStatus === 'mastered' || row.isMastered ? '取消掌握' : '标记掌握' }}
              </button>
              <button type="button" class="btn btn-ghost text-xs text-red-600" @click="remove(row)">删除</button>
              <button type="button" class="btn btn-outline text-xs" @click="practiceOne(row)">再练这题</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!rows.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">
        暂无错题
      </div>

      <div v-if="meta.totalPages > 1" class="flex justify-center gap-2">
        <button type="button" class="btn btn-ghost" :disabled="page <= 1" @click="page--; load()">上一页</button>
        <span class="text-sm self-center" style="color: var(--color-text-secondary)">
          {{ page }} / {{ meta.totalPages }}
        </span>
        <button
          type="button"
          class="btn btn-ghost"
          :disabled="page >= meta.totalPages"
          @click="page++; load()"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  deleteWrongQuestion,
  getWrongQuestions,
  getWrongQuestionStats,
  markAsMastered,
  unmarkAsMastered,
} from '../api/v3/wrongQuestions'
import { usePracticeLaunchStore } from '../stores/quiz'
import toast from '../utils/toast'

const router = useRouter()
const launchStore = usePracticeLaunchStore()

const loading = ref(false)
const err = ref('')
const rows = ref([])
const stats = ref(null)
const page = ref(1)
const masteryStatus = ref('unmastered')
const searchKeyword = ref('')
const selectedIds = ref([])
const meta = reactive({ total: 0, totalPages: 1 })

function rowId(row) {
  return row._id || row.id || questionIdOf(row)
}

function questionIdOf(row) {
  return String(row.questionId || row.question?._id || row.question?.id || row._id || '')
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const result = await getWrongQuestions({
      page: page.value,
      limit: 20,
      masteryStatus: masteryStatus.value || undefined,
      searchKeyword: searchKeyword.value || undefined,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    })
    rows.value = result?.items || result?.data || (Array.isArray(result) ? result : [])
    meta.total = result?.total ?? result?.meta?.total ?? rows.value.length
    meta.totalPages = result?.totalPages ?? result?.meta?.totalPages ?? 1
  } catch (e) {
    console.error(e)
    err.value = e?.response?.data?.message || '加载错题失败'
    rows.value = []
  } finally {
    loading.value = false
  }

  try {
    stats.value = await getWrongQuestionStats()
  } catch {
    stats.value = null
  }
}

function toggleSelect(id, checked) {
  if (!id) return
  if (checked) selectedIds.value = [...new Set([...selectedIds.value, id])]
  else selectedIds.value = selectedIds.value.filter((x) => x !== id)
}

async function toggleMaster(row) {
  const id = questionIdOf(row)
  if (!id) return
  try {
    if (row.masteryStatus === 'mastered' || row.isMastered) await unmarkAsMastered(id)
    else await markAsMastered(id)
    toast('已更新', 'success')
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || '操作失败', 'error')
  }
}

async function remove(row) {
  const id = questionIdOf(row)
  if (!id || !confirm('确定删除该错题记录？')) return
  try {
    await deleteWrongQuestion(id)
    toast('已删除', 'success')
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || '删除失败', 'error')
  }
}

function practiceOne(row) {
  const id = questionIdOf(row)
  if (!id) return
  launchStore.launch([id], 'review')
  router.push('/quiz')
}

function practiceSelected() {
  if (!selectedIds.value.length) return
  launchStore.launch(selectedIds.value, 'review')
  router.push('/quiz')
}

onMounted(load)
</script>
