<template>
  <div class="space-y-4 animate-rise-in">
    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <template v-else-if="discussion">
      <div class="flex gap-2">
        <RouterLink to="/community" class="btn btn-ghost text-sm">← 返回社区</RouterLink>
        <button type="button" class="btn btn-outline text-sm" @click="like">点赞 ({{ discussion.likeCount || 0 }})</button>
      </div>

      <div class="surface space-y-3">
        <h1 class="text-2xl font-bold">{{ discussion.title }}</h1>
        <p class="text-xs" style="color: var(--color-text-tertiary)">
          {{ discussion.author?.name || '用户' }} · {{ formatTime(discussion.createdAt) }}
        </p>
        <p class="whitespace-pre-wrap text-sm">{{ discussion.content }}</p>
      </div>

      <div class="surface space-y-3">
        <h2 class="font-semibold">回复 ({{ replies.length }})</h2>
        <div v-for="r in replies" :key="r._id" class="border-b py-3" style="border-color: var(--color-border)">
          <p class="text-xs mb-1" style="color: var(--color-text-tertiary)">
            {{ r.author?.name || r.authorName || '用户' }} · {{ formatTime(r.createdAt) }}
          </p>
          <p class="text-sm whitespace-pre-wrap">{{ r.content }}</p>
        </div>
        <p v-if="!replies.length" class="text-sm" style="color: var(--color-text-tertiary)">暂无回复</p>

        <form class="space-y-2 pt-2" @submit.prevent="reply">
          <textarea v-model="replyText" class="input min-h-[80px]" rows="3" placeholder="写下你的回复…" />
          <button type="submit" class="btn btn-primary" :disabled="replying || !replyText.trim()">发表回复</button>
        </form>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { addReply, getDiscussionDetail, likeDiscussion } from '../api/v3/discussions'
import toast from '../utils/toast'

const route = useRoute()
const loading = ref(true)
const err = ref('')
const discussion = ref(null)
const replyText = ref('')
const replying = ref(false)

const replies = computed(() => {
  const d = discussion.value
  if (!d) return []
  return d.replies || d.replyList || []
})

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
    const res = await getDiscussionDetail(route.params.id)
    discussion.value = res?.data || res
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function like() {
  try {
    await likeDiscussion(route.params.id)
    await load()
  } catch (e) {
    toast(e?.message || '点赞失败', 'error')
  }
}

async function reply() {
  if (!replyText.value.trim()) return
  replying.value = true
  try {
    await addReply(route.params.id, replyText.value.trim())
    replyText.value = ''
    toast('已回复', 'success')
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '回复失败', 'error')
  } finally {
    replying.value = false
  }
}

onMounted(load)
</script>
