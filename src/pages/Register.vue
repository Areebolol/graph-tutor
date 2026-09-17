<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md animate-rise-in">
      <div class="surface space-y-6">
        <div>
          <h1 class="text-xl font-semibold">注册</h1>
          <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">
            当前是纯前端项目，没有真实账号服务。可直接进入演示账号。
          </p>
        </div>

        <div v-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {{ err }}
        </div>

        <button type="button" class="btn btn-primary w-full !py-3" :disabled="busy" @click="enterDemo">
          {{ busy ? '进入中…' : '演示登录并进入' }}
        </button>

        <p class="text-sm text-center" style="color: var(--color-text-secondary)">
          已有演示入口？
          <RouterLink to="/login" class="font-semibold text-blue-600">返回登录</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const err = ref('')
const busy = ref(false)

async function enterDemo() {
  err.value = ''
  busy.value = true
  try {
    auth.loginAsDemo('admin')
    router.replace('/home')
  } catch (e) {
    err.value = e?.message || '演示登录失败'
  } finally {
    busy.value = false
  }
}
</script>
