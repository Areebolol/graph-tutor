<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md animate-rise-in">
      <div class="surface space-y-4">
        <h1 class="text-xl font-semibold">忘记密码</h1>
        <p class="text-sm" style="color: var(--color-text-secondary)">
          账号保存在当前浏览器。输入注册邮箱和新密码即可重置。
        </p>

        <div v-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {{ err }}
        </div>
        <div v-if="ok" class="rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm">
          {{ ok }}
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <div class="flex flex-col gap-2">
            <label class="label">邮箱</label>
            <input v-model="email" type="email" class="input" placeholder="your@email.com" :disabled="busy" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="label">新密码</label>
            <input v-model="password" type="password" class="input" placeholder="至少 6 位" :disabled="busy" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="label">确认新密码</label>
            <input v-model="confirm" type="password" class="input" placeholder="再输入一次新密码" :disabled="busy" />
          </div>
          <button type="submit" class="btn btn-primary w-full !py-3" :disabled="busy">
            {{ busy ? '重置中…' : '重置密码' }}
          </button>
        </form>

        <RouterLink to="/login" class="btn btn-ghost inline-flex">返回登录</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { resetLocalPassword } from '../utils/localAuth'

const email = ref('')
const password = ref('')
const confirm = ref('')
const err = ref('')
const ok = ref('')
const busy = ref(false)

async function submit() {
  err.value = ''
  ok.value = ''
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
    await resetLocalPassword(email.value, password.value)
    ok.value = '密码已重置，请返回登录'
  } catch (e) {
    err.value = e?.message || '重置失败'
  } finally {
    busy.value = false
  }
}
</script>
