<template>
  <div class="space-y-4 animate-rise-in">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">消息</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">
        与好友私信。演示模式下发送后会自动回复，并定时刷新会话。
      </p>
    </div>

    <div class="grid md:grid-cols-[240px_1fr] gap-4 min-h-[420px]">
      <div class="surface space-y-2 overflow-y-auto max-h-[70vh]">
        <button
          v-for="c in conversations"
          :key="c.userId || c._id"
          type="button"
          class="w-full text-left px-3 py-2 rounded-lg text-sm"
          :class="selectedId === String(c.userId) ? 'bg-blue-50 font-semibold' : ''"
          @click="selectUser(c.userId)"
        >
          <div class="truncate">{{ c.name || c.email || c.userId }}</div>
          <div class="text-xs truncate" style="color: var(--color-text-tertiary)">
            {{ c.lastMessage?.content || c.lastContent || '' }}
          </div>
        </button>
        <p v-if="!conversations.length" class="text-xs px-2" style="color: var(--color-text-tertiary)">暂无会话</p>
      </div>

      <div class="surface flex flex-col min-h-[420px]">
        <div v-if="!selectedId" class="flex-1 flex items-center justify-center text-sm" style="color: var(--color-text-tertiary)">
          选择左侧会话，或从好友页点「发消息」
        </div>
        <template v-else>
          <div class="flex-1 overflow-y-auto space-y-2 mb-3 max-h-[50vh]">
            <div
              v-for="m in messages"
              :key="m._id || m.id || m.createdAt"
              class="max-w-[80%] px-3 py-2 rounded-xl text-sm"
              :class="isMine(m) ? 'ml-auto bg-blue-100' : 'mr-auto'"
              :style="isMine(m) ? {} : { background: 'var(--color-bg-secondary)' }"
            >
              <p>{{ m.content }}</p>
              <div class="flex items-center justify-between gap-2 mt-1">
                <span class="text-[10px] opacity-60">{{ formatTime(m.createdAt) }}</span>
                <button type="button" class="text-[10px] text-blue-600" @click="copyMessage(m)">复制</button>
              </div>
            </div>
            <p v-if="!messages.length" class="text-sm text-center" style="color: var(--color-text-tertiary)">暂无消息</p>
          </div>
          <form class="flex gap-2" @submit.prevent="send">
            <input v-model="draft" class="input flex-1" placeholder="输入消息…" />
            <button type="submit" class="btn btn-primary" :disabled="sending || !draft.trim()">发送</button>
          </form>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  getConversation,
  getConversations,
  markMessagesAsRead,
  sendMessage,
} from '../api/v3/messages'
import { useAuthStore } from '../stores/auth'
import toast from '../utils/toast'

const auth = useAuthStore()
const route = useRoute()

const conversations = ref([])
const messages = ref([])
const selectedId = ref('')
const draft = ref('')
const sending = ref(false)
let pollTimer = null

function myId() {
  return String(auth.user?._id || auth.user?.id || '')
}

function isMine(m) {
  const sid = String(m.senderId || m.from || m.sender?._id || '')
  return sid === myId()
}

function formatTime(t) {
  if (!t) return ''
  try {
    return new Date(t).toLocaleString('zh-CN')
  } catch {
    return String(t)
  }
}

async function copyMessage(m) {
  try {
    await navigator.clipboard.writeText(m.content || '')
    toast('已复制', 'success')
  } catch {
    toast('复制失败', 'error')
  }
}

async function loadConversations() {
  try {
    const data = await getConversations()
    conversations.value = Array.isArray(data) ? data : data?.items || data?.conversations || []
  } catch {
    conversations.value = []
  }
}

async function loadMessages(userId = selectedId.value, silent = false) {
  if (!userId) return
  try {
    const data = await getConversation(userId, { limit: 50 })
    messages.value = Array.isArray(data) ? data : data?.items || data?.messages || []
    await markMessagesAsRead(userId).catch(() => {})
  } catch (e) {
    if (!silent) {
      messages.value = []
      toast(e?.response?.data?.message || e.message || '加载会话失败', 'error')
    }
  }
}

async function selectUser(userId) {
  selectedId.value = String(userId)
  await loadMessages(userId)
}

async function send() {
  if (!draft.value.trim() || !selectedId.value) return
  sending.value = true
  try {
    const msg = await sendMessage({
      receiverId: selectedId.value,
      content: draft.value.trim(),
    })
    messages.value = [...messages.value, msg]
    draft.value = ''
    await loadConversations()
    setTimeout(() => {
      loadMessages(selectedId.value, true)
      loadConversations()
    }, 900)
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '发送失败', 'error')
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  await loadConversations()
  const q = route.query.userId
  if (typeof q === 'string' && q) await selectUser(q)
  pollTimer = setInterval(() => {
    loadConversations()
    if (selectedId.value) loadMessages(selectedId.value, true)
  }, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
