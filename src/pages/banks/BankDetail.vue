<template>
  <div class="space-y-4 animate-rise-in">
    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <template v-else-if="bank">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">{{ bank.name }}</h1>
          <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">
            {{ bank.description || '暂无描述' }}
          </p>
          <div class="mt-2 flex flex-wrap gap-2 text-xs" style="color: var(--color-text-tertiary)">
            <span>{{ subjectLabel }}</span>
            <span>{{ bank.questionCount || questions.length }} 题</span>
            <span>{{ bank.isPublic ? '公开' : '私有' }}</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink to="/banks" class="btn btn-ghost">返回列表</RouterLink>
          <template v-if="canManage">
            <RouterLink :to="`/banks/${bank._id}/edit`" class="btn btn-outline">编辑</RouterLink>
            <RouterLink :to="`/questions/create?bankId=${bank._id}`" class="btn btn-primary">添加题目</RouterLink>
            <button type="button" class="btn btn-ghost text-red-600" @click="onDelete">删除</button>
          </template>
        </div>
      </div>

      <div class="surface space-y-3">
        <div class="flex items-center justify-between gap-2">
          <h2 class="font-semibold">题库题目</h2>
          <RouterLink :to="`/questions?bankId=${bank._id}`" class="text-sm text-blue-600">在题目列表中查看</RouterLink>
        </div>
        <div v-if="qLoading" class="text-sm" style="color: var(--color-text-secondary)">加载题目…</div>
        <div v-else class="space-y-2">
          <RouterLink
            v-for="q in questions"
            :key="q._id"
            :to="`/questions/${q._id}/detail`"
            class="block px-3 py-2 rounded-lg border hover:opacity-90"
            style="border-color: var(--color-border)"
          >
            <div class="text-sm font-medium line-clamp-2">{{ q.content }}</div>
            <div class="text-xs mt-1" style="color: var(--color-text-tertiary)">
              {{ typeLabel(q.type) }} · 难度 {{ q.difficulty || '—' }}
            </div>
          </RouterLink>
          <p v-if="!questions.length" class="text-sm" style="color: var(--color-text-tertiary)">暂无题目</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deleteBank, getBank } from '../../api/v3/questionBanks'
import { getQuestions } from '../../api/v3/questions'
import { useAuthStore } from '../../stores/auth'
import { canManageResources } from '../../utils/role'
import toast from '../../utils/toast'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const canManage = computed(() => canManageResources(auth.user))

const loading = ref(true)
const qLoading = ref(false)
const err = ref('')
const bank = ref(null)
const questions = ref([])

const subjectLabel = computed(() => {
  const s = bank.value?.subjectCode
  if (!s) return '未分学科'
  if (typeof s === 'string') return s
  return s.name || s.code || '—'
})

function typeLabel(t) {
  return { single: '单选', multiple: '多选', judge: '判断', fill: '填空', short: '简答', coding: '编程' }[t] || t || '—'
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    bank.value = await getBank(route.params.id)
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
  } finally {
    loading.value = false
  }

  qLoading.value = true
  try {
    const res = await getQuestions({ bankId: route.params.id, limit: 30 })
    questions.value = res.data || []
  } catch {
    questions.value = []
  } finally {
    qLoading.value = false
  }
}

async function onDelete() {
  if (!confirm('确定删除该题库？此操作不可恢复。')) return
  try {
    await deleteBank(bank.value._id)
    toast('题库已删除', 'success')
    router.replace('/banks')
  } catch (e) {
    toast(e?.message || '删除失败', 'error')
  }
}

onMounted(load)
</script>
