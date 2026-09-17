<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-2xl surface space-y-4 animate-rise-in">
      <div v-if="loading" class="text-sm" style="color: var(--color-text-secondary)">加载分享笔记…</div>
      <div v-else-if="err" class="text-sm text-red-600">{{ err }}</div>
      <template v-else-if="note">
        <h1 class="text-2xl font-bold tracking-tight">{{ note.title || '分享笔记' }}</h1>
        <p class="text-xs" style="color: var(--color-text-tertiary)">
          {{ note.author?.name || note.user?.name || '匿名' }}
        </p>
        <div class="text-sm whitespace-pre-wrap leading-relaxed" style="color: var(--color-text-primary)">
          {{ note.content }}
        </div>
        <RouterLink to="/notes/public" class="btn btn-outline inline-flex">更多公开笔记</RouterLink>
      </template>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getNoteByShareToken } from '../api/v3/notes'

const route = useRoute()
const loading = ref(true)
const err = ref('')
const note = ref(null)

onMounted(async () => {
  try {
    const data = await getNoteByShareToken(route.params.token)
    note.value = data?.note || data
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '分享无效或已失效'
  } finally {
    loading.value = false
  }
})
</script>
