<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">学习动态</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">分享学习心得与进度</p>
      </div>
      <button type="button" class="btn btn-primary" @click="showCreate = !showCreate">
        {{ showCreate ? '收起' : '发动态' }}
      </button>
    </div>

    <form v-if="showCreate" class="surface space-y-3" @submit.prevent="create">
      <div>
        <label class="label">类型</label>
        <select v-model="form.type" class="input">
          <option value="note">心得</option>
          <option value="progress">进度</option>
          <option value="achievement">成就</option>
        </select>
      </div>
      <div>
        <label class="label">内容 *</label>
        <textarea v-model="form.content" class="input min-h-[100px]" rows="4" required />
      </div>
      <button type="submit" class="btn btn-primary" :disabled="saving">发布</button>
    </form>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <div v-else class="space-y-2">
      <div v-for="p in posts" :key="p._id" class="surface space-y-2">
        <div class="flex justify-between gap-2 text-xs" style="color: var(--color-text-tertiary)">
          <span>{{ p.author?.name || p.user?.name || '用户' }} · {{ p.type || 'note' }}</span>
          <span>{{ formatTime(p.createdAt) }}</span>
        </div>
        <p class="text-sm whitespace-pre-wrap">{{ p.content || p.title }}</p>
        <button type="button" class="btn btn-ghost text-xs" @click="like(p)">
          赞 {{ p.likeCount || 0 }}
        </button>
      </div>
      <div v-if="!posts.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">
        暂无动态
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { createLearningPost, getLearningPosts, toggleLikePost } from '../api/v3/learningPosts'
import toast from '../utils/toast'

const loading = ref(false)
const saving = ref(false)
const err = ref('')
const posts = ref([])
const showCreate = ref(false)
const form = reactive({ type: 'note', content: '' })

function formatTime(t) {
  if (!t) return ''
  try {
    return new Date(t).toLocaleString('zh-CN')
  } catch {
    return String(t)
  }
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const res = await getLearningPosts({ page: 1, limit: 30 })
    const data = res?.data || res
    posts.value = data?.items || data?.posts || (Array.isArray(data) ? data : [])
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    posts.value = []
  } finally {
    loading.value = false
  }
}

async function create() {
  if (!form.content.trim()) return
  saving.value = true
  try {
    await createLearningPost({ type: form.type, content: form.content.trim() })
    toast('已发布', 'success')
    form.content = ''
    showCreate.value = false
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '发布失败', 'error')
  } finally {
    saving.value = false
  }
}

async function like(p) {
  try {
    await toggleLikePost(p._id)
    await load()
  } catch (e) {
    toast(e?.message || '点赞失败', 'error')
  }
}

onMounted(load)
</script>
