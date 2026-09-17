<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">通知</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">系统与社交消息提醒</p>
      </div>
      <button type="button" class="btn btn-outline" :disabled="busy" @click="readAll">全部已读</button>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>
    <div v-else class="space-y-2">
      <div
        v-for="n in items"
        :key="n._id"
        class="surface flex flex-wrap justify-between gap-3"
        :class="{ 'opacity-70': n.isRead || n.read }"
      >
        <div>
          <p class="font-semibold text-sm">{{ n.title || n.type || '通知' }}</p>
          <p class="text-sm mt-1" style="color: var(--color-text-secondary)">{{ n.content || n.message || n.body }}</p>
          <p class="text-xs mt-1" style="color: var(--color-text-tertiary)">{{ formatDate(n.createdAt) }}</p>
        </div>
        <div class="flex gap-2 shrink-0">
          <button
            v-if="!(n.isRead || n.read)"
            type="button"
            class="btn btn-ghost text-xs"
            @click="readOne(n)"
          >
            标已读
          </button>
          <button type="button" class="btn btn-ghost text-xs text-red-600" @click="remove(n)">删除</button>
        </div>
      </div>
      <div v-if="!items.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">
        暂无通知
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import {
  deleteNotification,
  getNotifications,
  markAllAsRead,
  markAsRead,
} from '../api/v3/notifications'
import toast from '../utils/toast'

const loading = ref(false)
const busy = ref(false)
const err = ref('')
const items = ref([])

function formatDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleString('zh-CN')
  } catch {
    return String(d)
  }
}

function normalizeList(data) {
  return data?.items || data?.notifications || (Array.isArray(data) ? data : [])
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const data = await getNotifications({ limit: 50 })
    items.value = normalizeList(data)
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    items.value = []
  } finally {
    loading.value = false
  }
}

async function readOne(n) {
  try {
    await markAsRead(n._id)
    n.isRead = true
    n.read = true
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '操作失败', 'error')
  }
}

async function readAll() {
  busy.value = true
  try {
    await markAllAsRead()
    toast('已全部标为已读', 'success')
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '操作失败', 'error')
  } finally {
    busy.value = false
  }
}

async function remove(n) {
  try {
    await deleteNotification(n._id)
    items.value = items.value.filter((x) => x._id !== n._id)
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '删除失败', 'error')
  }
}

onMounted(load)
</script>
