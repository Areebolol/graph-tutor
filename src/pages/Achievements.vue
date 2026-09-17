<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">成就</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">学习里程碑与解锁进度</p>
      </div>
      <button type="button" class="btn btn-outline" :disabled="checking" @click="check">
        {{ checking ? '检查中…' : '检查新成就' }}
      </button>
    </div>

    <div v-if="stats" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div class="surface text-center">
        <p class="text-xl font-bold">{{ stats.unlocked ?? stats.unlockedCount ?? '—' }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">已解锁</p>
      </div>
      <div class="surface text-center">
        <p class="text-xl font-bold">{{ stats.total ?? stats.totalCount ?? achievements.length }}</p>
        <p class="text-xs" style="color: var(--color-text-secondary)">全部</p>
      </div>
      <div class="surface text-center">
        <p class="text-xl font-bold" style="color: var(--color-primary-deep)">
          {{ stats.points ?? stats.totalPoints ?? '—' }}
        </p>
        <p class="text-xs" style="color: var(--color-text-secondary)">成就点</p>
      </div>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>
    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="a in achievements"
        :key="a._id || a.code || a.name"
        class="surface space-y-1"
        :class="{ 'opacity-60': !(a.unlocked || a.isUnlocked) }"
      >
        <h2 class="font-semibold text-sm">{{ a.name || a.title }}</h2>
        <p class="text-xs" style="color: var(--color-text-secondary)">{{ a.description || a.desc }}</p>
        <p class="text-xs" style="color: var(--color-text-tertiary)">
          {{ a.unlocked || a.isUnlocked ? '已解锁' : `进度 ${a.progress ?? 0}${a.target ? '/' + a.target : ''}` }}
        </p>
      </div>
      <div v-if="!achievements.length" class="surface text-center text-sm col-span-full" style="color: var(--color-text-tertiary)">
        暂无成就数据
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { checkAchievements, getAchievements, getAchievementStats } from '../api/v3/achievements'
import toast from '../utils/toast'

const loading = ref(false)
const checking = ref(false)
const err = ref('')
const achievements = ref([])
const stats = ref(null)

function normalizeList(data) {
  return data?.items || data?.achievements || (Array.isArray(data) ? data : [])
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const [list, st] = await Promise.all([
      getAchievements(),
      getAchievementStats().catch(() => null),
    ])
    achievements.value = normalizeList(list)
    stats.value = st
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    achievements.value = []
  } finally {
    loading.value = false
  }
}

async function check() {
  checking.value = true
  try {
    await checkAchievements()
    toast('已检查', 'success')
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '检查失败', 'error')
  } finally {
    checking.value = false
  }
}

onMounted(load)
</script>
