<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">学习目标</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">设定并追踪阶段性目标</p>
      </div>
      <button type="button" class="btn btn-primary" @click="showForm = !showForm">
        {{ showForm ? '收起' : '新建目标' }}
      </button>
    </div>

    <form v-if="showForm" class="surface space-y-3 max-w-xl" @submit.prevent="save">
      <div>
        <label class="label">标题 *</label>
        <input v-model="form.title" class="input" required />
      </div>
      <div>
        <label class="label">描述</label>
        <textarea v-model="form.description" class="input" rows="2" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">目标值</label>
          <input v-model.number="form.target" type="number" min="1" class="input" />
        </div>
        <div>
          <label class="label">类型</label>
          <select v-model="form.type" class="input">
            <option value="questions">做题数</option>
            <option value="days">天数</option>
            <option value="accuracy">正确率</option>
          </select>
        </div>
      </div>
      <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? '保存中…' : '创建' }}</button>
    </form>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>
    <div v-else class="space-y-2">
      <div v-for="g in goals" :key="g._id" class="surface flex flex-wrap justify-between gap-3">
        <div>
          <h2 class="font-semibold">{{ g.title || g.name }}</h2>
          <p class="text-sm mt-1" style="color: var(--color-text-secondary)">
            {{ g.current ?? g.progress ?? 0 }} / {{ g.target ?? g.goal ?? '—' }}
            · {{ g.status || 'active' }}
          </p>
        </div>
        <button type="button" class="btn btn-ghost text-xs text-red-600" @click="remove(g)">删除</button>
      </div>
      <div v-if="!goals.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">
        暂无目标
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { createLearningGoal, deleteLearningGoal, getLearningGoals } from '../api/v3/learningGoals'
import toast from '../utils/toast'

const loading = ref(false)
const saving = ref(false)
const err = ref('')
const showForm = ref(false)
const goals = ref([])
const form = reactive({ title: '', description: '', target: 50, type: 'questions' })

function normalizeList(data) {
  return data?.items || data?.goals || (Array.isArray(data) ? data : [])
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    goals.value = normalizeList(await getLearningGoals())
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    goals.value = []
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await createLearningGoal({ ...form })
    toast('已创建', 'success')
    showForm.value = false
    form.title = ''
    form.description = ''
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '创建失败', 'error')
  } finally {
    saving.value = false
  }
}

async function remove(g) {
  if (!confirm('删除该目标？')) return
  try {
    await deleteLearningGoal(g._id)
    toast('已删除', 'success')
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '删除失败', 'error')
  }
}

onMounted(load)
</script>
