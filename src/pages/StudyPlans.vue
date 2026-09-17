<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">学习计划</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">制定目标、跟踪进度，并配合打卡坚持学习</p>
      </div>
      <div class="flex gap-2">
        <RouterLink to="/check-in" class="btn btn-outline">去打卡</RouterLink>
        <button type="button" class="btn btn-primary" @click="showForm = !showForm">
          {{ showForm ? '收起' : '新建计划' }}
        </button>
      </div>
    </div>

    <div v-if="stats" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="surface text-center">
        <p class="text-xl font-bold">{{ stats.totalPlans ?? plans.length }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">计划数</p>
      </div>
      <div class="surface text-center">
        <p class="text-xl font-bold text-green-600">{{ stats.activePlans ?? '—' }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">进行中</p>
      </div>
      <div class="surface text-center">
        <p class="text-xl font-bold">{{ stats.checkInDays ?? stats.totalCheckIns ?? '—' }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">打卡天数</p>
      </div>
      <div class="surface text-center">
        <p class="text-xl font-bold" style="color: var(--color-primary-deep)">{{ stats.streak ?? '—' }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">连续</p>
      </div>
    </div>

    <form v-if="showForm" class="surface space-y-3 max-w-xl" @submit.prevent="save">
      <div>
        <label class="label">名称 *</label>
        <input v-model="form.name" class="input" required />
      </div>
      <div>
        <label class="label">描述</label>
        <textarea v-model="form.description" class="input" rows="2" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">开始</label>
          <input v-model="form.startDate" type="date" class="input" required />
        </div>
        <div>
          <label class="label">结束</label>
          <input v-model="form.endDate" type="date" class="input" required />
        </div>
      </div>
      <div>
        <label class="label">每日目标题数</label>
        <input v-model.number="form.dailyTarget" type="number" min="1" class="input" />
      </div>
      <div v-if="formErr" class="text-sm text-red-600">{{ formErr }}</div>
      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? '保存中…' : '创建' }}
      </button>
    </form>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <div v-else class="space-y-2">
      <div v-for="p in plans" :key="p._id" class="surface space-y-3">
        <div class="flex flex-wrap justify-between gap-3">
          <div class="min-w-0">
            <h2 class="font-semibold">{{ p.name }}</h2>
            <p class="text-sm mt-1" style="color: var(--color-text-secondary)">
              {{ p.startDate?.slice?.(0, 10) || p.startDate }} → {{ p.endDate?.slice?.(0, 10) || p.endDate }}
              · 每日 {{ p.dailyTarget || 10 }} 题
              · {{ p.status || 'active' }}
            </p>
            <p v-if="p.description" class="text-xs mt-1" style="color: var(--color-text-tertiary)">{{ p.description }}</p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button type="button" class="btn btn-outline text-xs" :disabled="updating === p._id" @click="markDay(p)">
              完成一天
            </button>
            <RouterLink :to="`/check-in?planId=${p._id}`" class="btn btn-outline text-xs">打卡</RouterLink>
            <button type="button" class="btn btn-ghost text-xs text-red-600" @click="remove(p)">删除</button>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-xs mb-1" style="color: var(--color-text-secondary)">
            <span>进度 {{ planProgress(p).completed }}/{{ planProgress(p).total }} 天</span>
            <span>{{ planProgress(p).percent }}%</span>
          </div>
          <div class="h-2 rounded-full overflow-hidden" style="background: var(--color-bg-secondary)">
            <div
              class="h-full rounded-full transition-all"
              :style="{ width: `${planProgress(p).percent}%`, background: 'var(--color-primary-deep)' }"
            />
          </div>
        </div>
      </div>
      <div v-if="!plans.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">
        还没有学习计划
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  createStudyPlan,
  deleteStudyPlan,
  getStudyPlans,
  getStudyStats,
  updateStudyPlan,
} from '../api/v3/studyPlans'
import toast from '../utils/toast'

const loading = ref(false)
const saving = ref(false)
const updating = ref('')
const err = ref('')
const formErr = ref('')
const plans = ref([])
const stats = ref(null)
const showForm = ref(false)

const today = new Date()
const nextWeek = new Date()
nextWeek.setDate(today.getDate() + 7)

const form = reactive({
  name: '',
  description: '',
  type: 'daily',
  startDate: today.toISOString().slice(0, 10),
  endDate: nextWeek.toISOString().slice(0, 10),
  dailyTarget: 10,
})

function daySpan(start, end) {
  const a = new Date(start)
  const b = new Date(end)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 7
  return Math.max(1, Math.round((b - a) / 86400000) + 1)
}

function planProgress(p) {
  const total = Number(p.stats?.totalDays) || daySpan(p.startDate, p.endDate)
  const completed = Math.min(total, Number(p.stats?.completedDays) || 0)
  const percent = Math.round((completed / total) * 100)
  return { completed, total, percent }
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const res = await getStudyPlans({ limit: 50 })
    const data = res?.data || res
    plans.value = data?.items || data?.plans || (Array.isArray(data) ? data : [])
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    plans.value = []
  } finally {
    loading.value = false
  }
  try {
    const s = await getStudyStats()
    stats.value = s?.data || s
  } catch {
    stats.value = null
  }
}

async function save() {
  formErr.value = ''
  saving.value = true
  try {
    await createStudyPlan({
      ...form,
      stats: { totalDays: daySpan(form.startDate, form.endDate), completedDays: 0, currentStreak: 0 },
    })
    toast('计划已创建', 'success')
    showForm.value = false
    form.name = ''
    form.description = ''
    await load()
  } catch (e) {
    formErr.value = e?.response?.data?.message || e.message || '创建失败'
  } finally {
    saving.value = false
  }
}

async function markDay(p) {
  const progress = planProgress(p)
  if (progress.completed >= progress.total) {
    toast('该计划已完成', 'info')
    return
  }
  updating.value = p._id
  try {
    await updateStudyPlan(p._id, {
      stats: {
        ...(p.stats || {}),
        totalDays: progress.total,
        completedDays: progress.completed + 1,
        currentStreak: (p.stats?.currentStreak || 0) + 1,
      },
    })
    toast('已记录一天进度', 'success')
    await load()
  } catch (e) {
    toast(e?.message || '更新失败', 'error')
  } finally {
    updating.value = ''
  }
}

async function remove(p) {
  if (!confirm(`删除计划「${p.name}」？`)) return
  try {
    await deleteStudyPlan(p._id)
    toast('已删除', 'success')
    await load()
  } catch (e) {
    toast(e?.message || '删除失败', 'error')
  }
}

onMounted(load)
</script>
