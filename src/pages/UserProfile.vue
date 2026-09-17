<template>
  <div class="space-y-4 animate-rise-in">
    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <template v-else-if="profile">
      <div class="surface space-y-3">
        <div class="flex flex-wrap justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold">{{ profile.name || profile.email || '用户' }}</h1>
            <p class="text-sm mt-1" style="color: var(--color-text-secondary)">{{ profile.email }}</p>
            <p v-if="profile.bio" class="text-sm mt-2" style="color: var(--color-text-secondary)">{{ profile.bio }}</p>
            <div class="flex flex-wrap gap-2 mt-2 text-xs" style="color: var(--color-text-tertiary)">
              <span v-if="profile.school">{{ profile.school }}</span>
              <span v-if="profile.major">{{ profile.major }}</span>
              <span v-if="profile.grade">{{ profile.grade }}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <RouterLink to="/friends" class="btn btn-ghost">返回</RouterLink>
            <RouterLink v-if="isFriend" :to="`/messages?userId=${userId}`" class="btn btn-outline">发消息</RouterLink>
            <button v-else type="button" class="btn btn-primary" @click="addFriend">加好友</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { checkFriendship, getPublicUserProfile, sendFriendRequest } from '../api/v3/friends'
import toast from '../utils/toast'

const route = useRoute()
const userId = computed(() => String(route.params.id || ''))
const loading = ref(true)
const err = ref('')
const profile = ref(null)
const isFriend = ref(false)

async function load() {
  loading.value = true
  err.value = ''
  try {
    profile.value = await getPublicUserProfile(userId.value)
    try {
      isFriend.value = await checkFriendship(userId.value)
    } catch {
      isFriend.value = false
    }
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function addFriend() {
  try {
    await sendFriendRequest(userId.value, '你好，想加个好友一起学习')
    toast('好友请求已发送', 'success')
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '发送失败', 'error')
  }
}

onMounted(load)
</script>
