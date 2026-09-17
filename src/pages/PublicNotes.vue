<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">公开笔记</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">浏览社区公开学习笔记</p>
      </div>
      <RouterLink to="/notes" class="btn btn-ghost">我的笔记</RouterLink>
    </div>

    <div class="flex gap-2">
      <input v-model="q" class="input max-w-xs" placeholder="搜索" @keyup.enter="load" />
      <button type="button" class="btn btn-outline" @click="load">搜索</button>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>
    <div v-else class="space-y-2">
      <div v-for="n in notes" :key="n._id" class="surface space-y-2">
        <div class="flex flex-wrap justify-between gap-2">
          <div>
            <h2 class="font-semibold">{{ n.title || '无标题' }}</h2>
            <p class="text-xs mt-1" style="color: var(--color-text-tertiary)">
              {{ n.author?.name || n.user?.name || '匿名' }} · 👍 {{ n.likeCount ?? n.likes ?? 0 }}
            </p>
            <div v-if="(n.tags || []).length" class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="t in n.tags"
                :key="t"
                class="text-xs px-2 py-0.5 rounded-full border"
                style="border-color: var(--color-border)"
              >
                {{ t }}
              </span>
            </div>
          </div>
          <button type="button" class="btn btn-outline text-xs" @click="onLike(n)">点赞</button>
        </div>
        <p class="text-sm whitespace-pre-wrap line-clamp-5" style="color: var(--color-text-secondary)">
          {{ n.content }}
        </p>
      </div>
      <div v-if="!notes.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">
        暂无公开笔记
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getPublicNotes, likeNote } from '../api/v3/notes'
import toast from '../utils/toast'

const loading = ref(false)
const err = ref('')
const notes = ref([])
const q = ref('')

function normalizeList(data) {
  return data?.items || data?.notes || (Array.isArray(data) ? data : [])
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const data = await getPublicNotes({ searchKeyword: q.value || undefined, limit: 50 })
    notes.value = normalizeList(data)
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    notes.value = []
  } finally {
    loading.value = false
  }
}

async function onLike(n) {
  try {
    await likeNote(n._id)
    toast('已点赞', 'success')
    n.likeCount = (n.likeCount ?? n.likes ?? 0) + 1
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '点赞失败', 'error')
  }
}

onMounted(load)
</script>
