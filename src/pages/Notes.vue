<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">我的笔记</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">记录学习要点，可打标签、公开或分享</p>
      </div>
      <div class="flex gap-2">
        <RouterLink to="/notes/public" class="btn btn-outline">公开笔记</RouterLink>
        <button type="button" class="btn btn-primary" @click="showForm = !showForm">
          {{ showForm ? '收起' : '新建' }}
        </button>
      </div>
    </div>

    <form v-if="showForm" class="surface space-y-3 max-w-2xl" @submit.prevent="save">
      <div>
        <label class="label">标题 *</label>
        <input v-model="form.title" class="input" required maxlength="200" />
      </div>
      <div>
        <label class="label">内容 *</label>
        <textarea v-model="form.content" class="input" rows="6" required />
      </div>
      <div>
        <label class="label">标签</label>
        <input v-model="form.tagText" class="input" placeholder="用逗号分隔，例如：栈,队列,复习" />
      </div>
      <label class="flex items-center gap-2 text-sm">
        <input v-model="form.isPublic" type="checkbox" />
        公开
      </label>
      <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? '保存中…' : '保存' }}</button>
    </form>

    <div class="flex flex-wrap gap-2 items-end">
      <input v-model="q" class="input max-w-xs" placeholder="搜索标题/内容" @keyup.enter="load" />
      <select v-model="tagFilter" class="input max-w-[10rem]" @change="load">
        <option value="">全部标签</option>
        <option v-for="t in allTags" :key="t" :value="t">{{ t }}</option>
      </select>
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
              {{ n.isPublic ? '公开' : '私有' }} · {{ formatDate(n.updatedAt || n.createdAt) }}
            </p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button type="button" class="btn btn-ghost text-xs" @click="share(n)">分享</button>
            <button type="button" class="btn btn-ghost text-xs" @click="edit(n)">编辑</button>
            <button type="button" class="btn btn-ghost text-xs text-red-600" @click="remove(n)">删除</button>
          </div>
        </div>
        <div v-if="(n.tags || []).length" class="flex flex-wrap gap-1">
          <button
            v-for="t in n.tags"
            :key="t"
            type="button"
            class="text-xs px-2 py-0.5 rounded-full border"
            style="border-color: var(--color-border); color: var(--color-text-secondary)"
            @click="tagFilter = t; load()"
          >
            {{ t }}
          </button>
        </div>
        <p class="text-sm whitespace-pre-wrap line-clamp-4" style="color: var(--color-text-secondary)">
          {{ n.content }}
        </p>
      </div>
      <div v-if="!notes.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">
        暂无笔记
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { createNote, deleteNote, generateShareLink, getNotes, updateNote } from '../api/v3/notes'
import toast from '../utils/toast'

const loading = ref(false)
const saving = ref(false)
const err = ref('')
const notes = ref([])
const q = ref('')
const tagFilter = ref('')
const showForm = ref(false)
const editingId = ref(null)
const form = reactive({ title: '', content: '', isPublic: false, tagText: '' })

const allTags = computed(() => {
  const set = new Set()
  notes.value.forEach((n) => (n.tags || []).forEach((t) => set.add(t)))
  return [...set]
})

function parseTags(text) {
  return String(text || '')
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
}

function formatDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleString('zh-CN')
  } catch {
    return String(d)
  }
}

function normalizeList(data) {
  return data?.items || data?.notes || (Array.isArray(data) ? data : [])
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const data = await getNotes({
      searchKeyword: q.value || undefined,
      tags: tagFilter.value || undefined,
      limit: 50,
    })
    notes.value = normalizeList(data)
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    notes.value = []
  } finally {
    loading.value = false
  }
}

function edit(n) {
  editingId.value = n._id
  form.title = n.title || ''
  form.content = n.content || ''
  form.isPublic = Boolean(n.isPublic)
  form.tagText = (n.tags || []).join(', ')
  showForm.value = true
}

async function save() {
  saving.value = true
  try {
    const payload = {
      title: form.title,
      content: form.content,
      isPublic: form.isPublic,
      tags: parseTags(form.tagText),
    }
    if (editingId.value) await updateNote(editingId.value, payload)
    else await createNote(payload)
    toast('已保存', 'success')
    editingId.value = null
    form.title = ''
    form.content = ''
    form.isPublic = false
    form.tagText = ''
    showForm.value = false
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '保存失败', 'error')
  } finally {
    saving.value = false
  }
}

async function remove(n) {
  if (!confirm(`删除笔记「${n.title || '无标题'}」？`)) return
  try {
    await deleteNote(n._id)
    toast('已删除', 'success')
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '删除失败', 'error')
  }
}

async function share(n) {
  try {
    const data = await generateShareLink(n._id)
    const token = data?.shareToken || data?.token || data?.shareUrl
    const url =
      typeof token === 'string' && token.startsWith('http')
        ? token
        : `${window.location.origin}/notes/share/${token || n._id}`
    await navigator.clipboard.writeText(url)
    toast('分享链接已复制', 'success')
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '生成分享失败', 'error')
  }
}

onMounted(load)
</script>
