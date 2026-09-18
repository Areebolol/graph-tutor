<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md animate-rise-in">
      <div class="surface space-y-6">
        <div>
          <h1 class="text-xl font-semibold">注册</h1>
          <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">
            创建本机账号后即可登录。账号保存在当前浏览器，换设备需要重新注册。
          </p>
        </div>

        <div v-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {{ err }}
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <div class="flex flex-col gap-2">
            <label class="label">昵称</label>
            <input v-model="name" class="input" placeholder="例如：小田" :disabled="busy" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="label">邮箱</label>
            <input v-model="email" type="email" class="input" placeholder="your@email.com" :disabled="busy" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="label">密码</label>
            <input v-model="password" type="password" class="input" placeholder="至少 6 位" :disabled="busy" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="label">确认密码</label>
            <input v-model="confirm" type="password" class="input" placeholder="再输入一次密码" :disabled="busy" />
          </div>
          <button type="submit" class="btn btn-primary w-full !py-3" :disabled="busy">
            {{ busy ? '注册中…' : '注册并进入' }}
          </button>
        </form>

        <p class="text-sm text-center" style="color: var(--color-text-secondary)">
          已有账号？
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
const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const err = ref('')
const busy = ref(false)

async function submit() {
  err.value = ''
  if (!name.value.trim()) {
    err.value = '请输入昵称'
    return
  }
  if (!email.value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
    err.value = '请输入有效邮箱'
    return
  }
  if (!password.value || password.value.length < 6) {
    err.value = '密码至少 6 位'
    return
  }
  if (password.value !== confirm.value) {
    err.value = '两次输入的密码不一致'
    return
  }

  busy.value = true
  try {
    await auth.register({ name: name.value.trim(), email: email.value, password: password.value })
    router.replace('/home')
  } catch (e) {
    err.value = e?.message || '注册失败'
  } finally {
    busy.value = false
  }
}
</script>
