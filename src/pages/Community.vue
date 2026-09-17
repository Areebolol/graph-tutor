<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">学习社区</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">题目讨论与问答互助</p>
      </div>
      <button type="button" class="btn btn-primary" @click="showCreate = !showCreate">
        {{ showCreate ? '收起' : '发帖' }}
      </button>
    </div>

    <form v-if="showCreate" class="surface space-y-3" @submit.prevent="create">
      <div>
        <label class="label">标题 *</label>
        <input v-model="form.title" class="input" required />
      </div>
      <div>
        <label class="label">内容 *</label>
        <textarea v-model="form.content" class="input min-h-[100px]" rows="4" required />
      </div>
      <div v-if="formErr" class="text-sm text-red-600">{{ formErr }}</div>
      <button type="submit" class="btn btn-primary" :disabled="saving">发布</button>
    </form>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <div v-else class="space-y-2">
      <RouterLink
        v-for="d in discussions"
        :key="d._id"
        :to="`/community/${d._id}`"
        class="surface block space-y-1 hover:opacity-95"
      >
        <h2 class="font-semibold">{{ d.title }}</h2>
        <p class="text-sm line-clamp-2" style="color: var(--color-text-secondary)">{{ d.content }}</p>
        <p class="text-xs" style="color: var(--color-text-tertiary)">
          {{ d.author?.name || d.authorName || '用户' }} · 赞 {{ d.likeCount || 0 }} · 回复 {{ d.replyCount || 0 }}
        </p>
      </RouterLink>
      <div v-if="!discussions.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">
        暂无讨论
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { createDiscussion, getDiscussions } from '../api/v3/discussions'
import toast from '../utils/toast'

const loading = ref(false)
const saving = ref(false)
const err = ref('')
const formErr = ref('')
const discussions = ref([])
const showCreate = ref(false)
const form = reactive({ title: '', content: '' })

async function load() {
  loading.value = true
  err.value = ''
  try {
    const res = await getDiscussions({ page: 1, limit: 30 })
    const data = res?.data || res
    discussions.value = data?.items || data?.discussions || (Array.isArray(data) ? data : [])
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    discussions.value = []
  } finally {
    loading.value = false
  }
}

async function create() {
  formErr.value = ''
  if (!form.title.trim() || !form.content.trim()) {
    formErr.value = '请填写标题和内容'
    return
  }
  saving.value = true
  try {
    await createDiscussion({ title: form.title.trim(), content: form.content.trim() })
    toast('已发布', 'success')
    form.title = ''
    form.content = ''
    showCreate.value = false
    await load()
  } catch (e) {
    formErr.value = e?.response?.data?.message || e.message || '发布失败'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
