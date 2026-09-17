<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight" style="color: var(--color-text-primary)">题库</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">浏览与管理题目集合</p>
      </div>
      <div v-if="canManage" class="flex flex-wrap gap-2">
        <RouterLink to="/banks/import" class="btn btn-outline">导入题库</RouterLink>
        <RouterLink to="/banks/create" class="btn btn-primary">新建题库</RouterLink>
      </div>
    </div>

    <div class="surface flex flex-wrap gap-3 items-end">
      <label class="text-sm flex-1 min-w-[160px]">
        <span class="label">搜索</span>
        <input v-model="search" class="input" placeholder="题库名称" @keyup.enter="page = 1; load()" />
      </label>
      <label class="text-sm min-w-[140px]">
        <span class="label">学科</span>
        <select v-model="subjectCode" class="input" @change="page = 1; load()">
          <option value="">全部</option>
          <option v-for="s in flatSubjects" :key="s.code" :value="s.code">{{ s.name }}</option>
        </select>
      </label>
      <button type="button" class="btn btn-outline" :disabled="loading" @click="load">刷新</button>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="bank in rows"
        :key="bank._id"
        :to="`/banks/${bank._id}`"
        class="surface block hover:opacity-95 transition-opacity space-y-2"
      >
        <h2 class="font-semibold" style="color: var(--color-text-primary)">{{ bank.name }}</h2>
        <p class="text-sm line-clamp-2" style="color: var(--color-text-secondary)">
          {{ bank.description || '暂无描述' }}
        </p>
        <div class="flex flex-wrap gap-2 text-xs" style="color: var(--color-text-tertiary)">
          <span>{{ subjectLabel(bank) }}</span>
          <span>{{ bank.questionCount || 0 }} 题</span>
          <span>{{ bank.isPublic ? '公开' : '私有' }}</span>
        </div>
      </RouterLink>
      <div v-if="!rows.length" class="sm:col-span-2 lg:col-span-3 surface text-center text-sm" style="color: var(--color-text-tertiary)">
        暂无题库
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
import { computed, onMounted, reactive, ref } from 'vue'
import { getBanks } from '../../api/v3/questionBanks'
import { getSubjectTree } from '../../api/v3/subjects'
import { useAuthStore } from '../../stores/auth'
import { canManageResources } from '../../utils/role'
import { flattenSubjects } from '../../utils/practiceSubmit'

const auth = useAuthStore()
const canManage = computed(() => canManageResources(auth.user))

const loading = ref(false)
const err = ref('')
const rows = ref([])
const page = ref(1)
const search = ref('')
const subjectCode = ref('')
const subjects = ref([])
const meta = reactive({ totalPages: 1 })

const flatSubjects = computed(() => flattenSubjects(subjects.value))

function subjectLabel(bank) {
  const s = bank.subjectCode
  if (!s) return '未分学科'
  if (typeof s === 'string') return s
  return s.name || s.code || '—'
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const res = await getBanks({
      page: page.value,
      limit: 12,
      search: search.value || undefined,
      subjectCode: subjectCode.value || undefined,
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

onMounted(async () => {
  try {
    subjects.value = await getSubjectTree()
  } catch {
    subjects.value = []
  }
  await load()
})
</script>
