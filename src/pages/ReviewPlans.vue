<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">复习计划</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">按计划复习错题与薄弱点</p>
      </div>
      <div class="flex gap-2">
        <RouterLink to="/review" class="btn btn-outline">错题本</RouterLink>
        <button type="button" class="btn btn-primary" @click="showForm = !showForm">
          {{ showForm ? '收起' : '新建计划' }}
        </button>
      </div>
    </div>

    <form v-if="showForm" class="surface space-y-3 max-w-xl" @submit.prevent="save">
      <div>
        <label class="label">名称 *</label>
        <input v-model="form.name" class="input" required />
      </div>
      <div>
        <label class="label">每日复习题数</label>
        <input v-model.number="form.dailyCount" type="number" min="1" class="input" />
      </div>
      <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? '创建中…' : '创建' }}</button>
    </form>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>
    <div v-else class="space-y-2">
      <div v-for="p in plans" :key="p._id" class="surface flex flex-wrap justify-between gap-3">
        <div>
          <h2 class="font-semibold">{{ p.name || p.title }}</h2>
          <p class="text-sm mt-1" style="color: var(--color-text-secondary)">
            每日 {{ p.dailyCount || p.dailyTarget || '—' }} · {{ p.status || 'active' }}
          </p>
        </div>
        <div class="flex gap-2 shrink-0">
          <button type="button" class="btn btn-primary text-xs" @click="run(p)">执行今日</button>
          <button type="button" class="btn btn-ghost text-xs text-red-600" @click="remove(p)">删除</button>
        </div>
      </div>
      <div v-if="!plans.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">
        暂无复习计划
      </div>
    </div>

    <div v-if="execResult" class="surface space-y-2">
      <h2 class="font-semibold text-sm">今日复习题目</h2>
      <p class="text-sm" style="color: var(--color-text-secondary)">
        共 {{ (execResult.questions || execResult.items || []).length }} 题
      </p>
      <RouterLink to="/review" class="btn btn-outline text-xs inline-flex">去错题本练习</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { createReviewPlan, deleteReviewPlan, executeReviewPlan, getReviewPlans } from '../api/v3/reviewPlans'
import toast from '../utils/toast'

const loading = ref(false)
const saving = ref(false)
const err = ref('')
const showForm = ref(false)
const plans = ref([])
const execResult = ref(null)
const form = reactive({ name: '', dailyCount: 10 })

function normalizeList(data) {
  return data?.items || data?.plans || (Array.isArray(data) ? data : [])
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    plans.value = normalizeList(await getReviewPlans())
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    plans.value = []
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await createReviewPlan({ name: form.name, dailyCount: form.dailyCount })
    toast('已创建', 'success')
    showForm.value = false
    form.name = ''
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '创建失败', 'error')
  } finally {
    saving.value = false
  }
}

async function run(p) {
  try {
    execResult.value = await executeReviewPlan(p._id)
    toast('已生成今日复习', 'success')
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '执行失败', 'error')
  }
}

async function remove(p) {
  if (!confirm('删除该复习计划？')) return
  try {
    await deleteReviewPlan(p._id)
    toast('已删除', 'success')
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '删除失败', 'error')
  }
}

onMounted(load)
</script>
