<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md animate-rise-in">
      <div class="mb-8 text-center">
        <p class="text-3xl sm:text-4xl font-bold tracking-tight" style="color: var(--color-text-primary)">
          GraphTutor
        </p>
        <p class="mt-2 text-sm" style="color: var(--color-text-secondary)">
          知识图谱驱动的智能学习（Vue）
        </p>
      </div>

      <div class="surface space-y-6">
        <div>
          <h1 class="text-xl font-semibold tracking-tight" style="color: var(--color-text-primary)">登录</h1>
          <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">使用邮箱、演示登录，或 GitHub 演示入口</p>
        </div>

        <div
          v-if="err"
          class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm animate-fade-in"
        >
          {{ err }}
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <div class="flex flex-col gap-2">
            <label class="label">邮箱</label>
            <input
              v-model="email"
              type="email"
              class="input"
              placeholder="your@email.com"
              :disabled="busy || githubBusy || demoBusy"
            />
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <label class="label mb-0">密码</label>
              <RouterLink to="/forgot-password" class="text-xs font-semibold text-blue-600 hover:text-blue-700">
                忘记密码？
              </RouterLink>
            </div>
            <div class="relative">
              <input
                v-model="password"
                :type="show ? 'text' : 'password'"
                class="input pr-12"
                placeholder="至少 6 位"
                :disabled="busy || githubBusy || demoBusy"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-3 flex items-center text-sm"
                style="color: var(--color-text-secondary)"
                @click="show = !show"
              >
                {{ show ? '隐藏' : '显示' }}
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary w-full !py-3" :disabled="busy || githubBusy || demoBusy">
            {{ busy ? '登录中…' : '登录' }}
          </button>
        </form>

        <button
          type="button"
          class="btn w-full !py-3 border"
          style="border-color: var(--color-border); color: var(--color-text-primary)"
          :disabled="busy || githubBusy || demoBusy"
          @click="submitDemo"
        >
          {{ demoBusy ? '进入中…' : '演示登录' }}
        </button>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t" style="border-color: var(--color-border)" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-3" style="background-color: var(--color-bg-primary); color: var(--color-text-tertiary)">
              或
            </span>
          </div>
        </div>

        <button
          type="button"
          class="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          :disabled="githubBusy || busy || demoBusy"
          @click="handleGitHubLogin"
        >
          {{ githubBusy ? '进入中…' : '使用 GitHub 登录（演示）' }}
        </button>

        <div class="text-sm text-center pt-2 border-t space-y-2" style="border-color: var(--color-border); color: var(--color-text-secondary)">
          <p>
            还没有账号？
            <RouterLink to="/register" class="ml-1.5 font-semibold text-blue-600 hover:text-blue-700">
              邮箱注册
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import toast from '../utils/toast'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const show = ref(false)
const err = ref('')
const busy = ref(false)
const githubBusy = ref(false)
const demoBusy = ref(false)

function goAfterLogin() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
  router.replace(redirect || '/home')
}

async function handleGitHubLogin() {
  githubBusy.value = true
  err.value = ''
  try {
    auth.loginAsDemo('admin')
    toast('纯前端项目不跳转真实 GitHub，已用演示账号进入', 'info')
    goAfterLogin()
  } catch (e) {
    err.value = e?.message || '演示登录失败'
  } finally {
    githubBusy.value = false
  }
}

async function submitDemo() {
  err.value = ''
  demoBusy.value = true
  try {
    auth.loginAsDemo('admin')
    goAfterLogin()
  } catch (e) {
    err.value = e?.message || '演示登录失败'
  } finally {
    demoBusy.value = false
  }
}

async function submit() {
  err.value = ''
  if (!email.value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
    err.value = '请输入有效邮箱'
    return
  }
  if (!password.value || password.value.length < 6) {
    err.value = '密码至少 6 位'
    return
  }

  busy.value = true
  try {
    await auth.login(email.value, password.value)
    goAfterLogin()
  } catch (e) {
    const offline =
      e?.response?.status === 503 ||
      e?.code === 'ERR_NETWORK' ||
      /后端|ECONNREFUSED|Network Error/i.test(String(e?.message || ''))
    if (offline) {
      err.value = '当前是纯前端项目，邮箱登录不可用。请使用「演示登录」。'
    } else {
      err.value = e?.message || '登录失败，请检查邮箱和密码'
    }
  } finally {
    busy.value = false
  }
}
</script>
