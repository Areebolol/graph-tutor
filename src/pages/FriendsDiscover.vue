<template>
  <div class="space-y-4 animate-rise-in">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">发现好友</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">按昵称或邮箱搜索用户</p>
    </div>

    <div class="surface flex gap-2">
      <input v-model="keyword" class="input flex-1" placeholder="关键词" @keyup.enter="search" />
      <button type="button" class="btn btn-primary" :disabled="loading" @click="search">搜索</button>
      <RouterLink to="/friends" class="btn btn-ghost">返回</RouterLink>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">搜索中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <div v-else class="space-y-2">
      <div v-for="u in users" :key="u._id || u.id" class="surface flex flex-wrap justify-between gap-3 items-center">
        <div>
          <p class="font-semibold">{{ u.name || u.email }}</p>
          <p class="text-xs" style="color: var(--color-text-tertiary)">{{ u.email }}</p>
        </div>
        <div class="flex gap-2">
          <RouterLink :to="`/users/${u._id || u.id}`" class="btn btn-ghost text-xs">资料</RouterLink>
          <button type="button" class="btn btn-outline text-xs" @click="add(u)">加好友</button>
        </div>
      </div>
      <div v-if="searched && !users.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">
        未找到用户
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { searchUsers, sendFriendRequest } from '../api/v3/friends'
import toast from '../utils/toast'

const keyword = ref('')
const users = ref([])
const loading = ref(false)
const err = ref('')
const searched = ref(false)

async function search() {
  if (!keyword.value.trim()) {
    toast('请输入关键词', 'warning')
    return
  }
  loading.value = true
  err.value = ''
  searched.value = true
  try {
    const data = await searchUsers({ keyword: keyword.value.trim(), page: 1, limit: 20 })
    users.value = data?.items || data || []
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '搜索失败'
    users.value = []
  } finally {
    loading.value = false
  }
}

async function add(u) {
  const id = u._id || u.id
  if (!id) return
  try {
    await sendFriendRequest(String(id), '你好，想加个好友一起学习')
    toast('好友请求已发送', 'success')
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '发送失败', 'error')
  }
}
</script>
