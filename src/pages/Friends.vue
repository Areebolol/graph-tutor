<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">好友</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">管理好友与好友请求</p>
      </div>
      <RouterLink to="/friends/discover" class="btn btn-primary">发现好友</RouterLink>
    </div>

    <div class="flex gap-2">
      <button type="button" class="btn text-sm" :class="tab === 'friends' ? 'btn-primary' : 'btn-outline'" @click="tab = 'friends'; loadFriends()">
        好友
      </button>
      <button type="button" class="btn text-sm" :class="tab === 'requests' ? 'btn-primary' : 'btn-outline'" @click="tab = 'requests'; loadRequests()">
        请求
      </button>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <div v-else-if="tab === 'friends'" class="space-y-2">
      <div v-for="f in friends" :key="friendUserId(f)" class="surface flex flex-wrap justify-between gap-3 items-center">
        <div>
          <p class="font-semibold">{{ displayName(f) }}</p>
          <p class="text-xs" style="color: var(--color-text-tertiary)">{{ friendEmail(f) }}</p>
        </div>
        <div class="flex gap-2">
          <RouterLink :to="`/users/${friendUserId(f)}`" class="btn btn-ghost text-xs">资料</RouterLink>
          <RouterLink :to="`/messages?userId=${friendUserId(f)}`" class="btn btn-outline text-xs">发消息</RouterLink>
          <button type="button" class="btn btn-ghost text-xs text-red-600" @click="remove(f)">删除</button>
        </div>
      </div>
      <div v-if="!friends.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">暂无好友</div>
    </div>

    <div v-else class="space-y-4">
      <div>
        <h2 class="font-semibold text-sm mb-2">收到的请求</h2>
        <div v-for="r in received" :key="r._id" class="surface flex flex-wrap justify-between gap-3 mb-2">
          <div>
            <p class="font-semibold">{{ requestFromName(r) }}</p>
            <p class="text-xs" style="color: var(--color-text-secondary)">{{ r.message || '请求添加好友' }}</p>
          </div>
          <div class="flex gap-2">
            <button type="button" class="btn btn-primary text-xs" @click="accept(r)">接受</button>
            <button type="button" class="btn btn-ghost text-xs" @click="reject(r)">拒绝</button>
          </div>
        </div>
        <p v-if="!received.length" class="text-sm" style="color: var(--color-text-tertiary)">暂无收到的请求</p>
      </div>
      <div>
        <h2 class="font-semibold text-sm mb-2">发出的请求</h2>
        <div v-for="r in sent" :key="r._id" class="surface flex flex-wrap justify-between gap-3 mb-2">
          <div>
            <p class="font-semibold">{{ requestToName(r) }}</p>
            <p class="text-xs" style="color: var(--color-text-tertiary)">{{ r.status || 'pending' }}</p>
          </div>
          <button type="button" class="btn btn-ghost text-xs" @click="cancel(r)">取消</button>
        </div>
        <p v-if="!sent.length" class="text-sm" style="color: var(--color-text-tertiary)">暂无发出的请求</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import {
  acceptFriendRequest,
  cancelFriendRequest,
  deleteFriend,
  getFriendRequests,
  getFriends,
  rejectFriendRequest,
} from '../api/v3/friends'
import toast from '../utils/toast'

const tab = ref('friends')
const loading = ref(false)
const err = ref('')
const friends = ref([])
const received = ref([])
const sent = ref([])

function friendUser(f) {
  return f.friend || f.user || f.friendId || f
}

function friendUserId(f) {
  const u = friendUser(f)
  return String(u._id || u.id || f.friendId || f._id || '')
}

function displayName(f) {
  const u = friendUser(f)
  return u.name || u.email || '用户'
}

function friendEmail(f) {
  const u = friendUser(f)
  return u.email || ''
}

function requestFromName(r) {
  const u = r.fromUser || r.from || r.sender || {}
  return u.name || u.email || '用户'
}

function requestToName(r) {
  const u = r.toUser || r.to || r.receiver || {}
  return u.name || u.email || '用户'
}

async function loadFriends() {
  loading.value = true
  err.value = ''
  try {
    const data = await getFriends({ page: 1, limit: 50 })
    friends.value = data?.items || data || []
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    friends.value = []
  } finally {
    loading.value = false
  }
}

async function loadRequests() {
  loading.value = true
  err.value = ''
  try {
    const [recv, s] = await Promise.all([
      getFriendRequests({ type: 'received', status: 'pending', limit: 50 }),
      getFriendRequests({ type: 'sent', limit: 50 }),
    ])
    received.value = recv?.items || recv || []
    sent.value = s?.items || s || []
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    received.value = []
    sent.value = []
  } finally {
    loading.value = false
  }
}

async function accept(r) {
  try {
    await acceptFriendRequest(r._id)
    toast('已接受', 'success')
    await loadRequests()
    await loadFriends()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '操作失败', 'error')
  }
}

async function reject(r) {
  try {
    await rejectFriendRequest(r._id)
    toast('已拒绝', 'success')
    await loadRequests()
  } catch (e) {
    toast(e?.message || '操作失败', 'error')
  }
}

async function cancel(r) {
  try {
    await cancelFriendRequest(r._id)
    toast('已取消', 'success')
    await loadRequests()
  } catch (e) {
    toast(e?.message || '操作失败', 'error')
  }
}

async function remove(f) {
  const id = friendUserId(f)
  if (!id || !confirm('确定删除该好友？')) return
  try {
    await deleteFriend(id)
    toast('已删除', 'success')
    await loadFriends()
  } catch (e) {
    toast(e?.message || '删除失败', 'error')
  }
}

onMounted(loadFriends)
</script>
