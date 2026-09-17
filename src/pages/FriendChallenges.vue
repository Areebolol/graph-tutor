<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">好友挑战</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">和好友比一比做题进度</p>
      </div>
      <button type="button" class="btn btn-primary" @click="showForm = !showForm">
        {{ showForm ? '收起' : '发起挑战' }}
      </button>
    </div>

    <div v-if="stats" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="surface text-center">
        <p class="text-xl font-bold">{{ stats.total ?? stats.totalChallenges ?? '—' }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">总数</p>
      </div>
      <div class="surface text-center">
        <p class="text-xl font-bold text-green-600">{{ stats.active ?? stats.activeChallenges ?? '—' }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">进行中</p>
      </div>
      <div class="surface text-center">
        <p class="text-xl font-bold">{{ stats.won ?? stats.wins ?? '—' }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">胜利</p>
      </div>
      <div class="surface text-center">
        <p class="text-xl font-bold">{{ stats.pending ?? '—' }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">待处理</p>
      </div>
    </div>

    <form v-if="showForm" class="surface space-y-3 max-w-xl" @submit.prevent="create">
      <div>
        <label class="label">挑战好友 *</label>
        <select v-model="form.participantId" class="input" required>
          <option value="">请选择</option>
          <option v-for="f in friends" :key="uid(f)" :value="uid(f)">{{ displayName(f) }}</option>
        </select>
      </div>
      <div>
        <label class="label">目标题数</label>
        <input v-model.number="form.targetCount" type="number" min="1" class="input" />
      </div>
      <div>
        <label class="label">天数</label>
        <input v-model.number="form.durationDays" type="number" min="1" class="input" />
      </div>
      <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? '发起中…' : '发起' }}</button>
    </form>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>
    <div v-else class="space-y-2">
      <div v-for="c in challenges" :key="c._id" class="surface flex flex-wrap justify-between gap-3">
        <div>
          <p class="font-semibold text-sm">
            {{ c.challenger?.name || c.initiator?.name || '我' }}
            vs
            {{ c.participant?.name || c.opponent?.name || '对方' }}
          </p>
          <p class="text-xs mt-1" style="color: var(--color-text-tertiary)">
            {{ c.status || 'pending' }} · 目标 {{ c.targetCount || c.goal || '—' }} 题
            · 进度 {{ c.myProgress ?? c.progress ?? 0 }}
          </p>
        </div>
        <div class="flex gap-2 shrink-0">
          <button
            v-if="(c.status || 'pending') === 'pending'"
            type="button"
            class="btn btn-primary text-xs"
            @click="accept(c)"
          >
            接受
          </button>
          <button
            v-if="['pending', 'active', 'accepted'].includes(c.status || 'pending')"
            type="button"
            class="btn btn-ghost text-xs"
            @click="cancel(c)"
          >
            取消
          </button>
          <button
            v-if="c.status === 'active' || c.status === 'accepted'"
            type="button"
            class="btn btn-outline text-xs"
            @click="sync(c)"
          >
            同步进度
          </button>
        </div>
      </div>
      <div v-if="!challenges.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">
        暂无挑战
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getFriends } from '../api/v3/friends'
import {
  acceptChallenge,
  cancelChallenge,
  createFriendChallenge,
  getChallengeStats,
  getFriendChallenges,
  updateChallengeProgress,
} from '../api/v3/friendChallenges'
import toast from '../utils/toast'

const loading = ref(false)
const saving = ref(false)
const err = ref('')
const showForm = ref(false)
const friends = ref([])
const challenges = ref([])
const stats = ref(null)
const form = reactive({ participantId: '', targetCount: 20, durationDays: 7 })

function uid(f) {
  return f?.user?._id || f?.friend?._id || f?._id || f?.userId || ''
}

function displayName(f) {
  const u = f?.user || f?.friend || f
  return u?.name || u?.email || '好友'
}

function normalizeList(data) {
  return data?.items || data?.challenges || (Array.isArray(data) ? data : [])
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const [list, st, fr] = await Promise.all([
      getFriendChallenges({ limit: 50 }),
      getChallengeStats().catch(() => null),
      getFriends().catch(() => []),
    ])
    challenges.value = normalizeList(list)
    stats.value = st
    friends.value = Array.isArray(fr) ? fr : fr?.friends || fr?.items || []
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    challenges.value = []
  } finally {
    loading.value = false
  }
}

async function create() {
  saving.value = true
  try {
    await createFriendChallenge(form.participantId, {
      targetCount: form.targetCount,
      durationDays: form.durationDays,
    })
    toast('已发起', 'success')
    showForm.value = false
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '发起失败', 'error')
  } finally {
    saving.value = false
  }
}

async function accept(c) {
  try {
    await acceptChallenge(c._id)
    toast('已接受', 'success')
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '操作失败', 'error')
  }
}

async function cancel(c) {
  try {
    await cancelChallenge(c._id)
    toast('已取消', 'success')
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '操作失败', 'error')
  }
}

async function sync(c) {
  try {
    await updateChallengeProgress(c._id)
    toast('进度已同步', 'success')
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '同步失败', 'error')
  }
}

onMounted(load)
</script>
