<template>
  <div class="space-y-4 animate-rise-in">
    <div>
      <h1 class="text-2xl font-bold tracking-tight" style="color: var(--color-text-primary)">个人中心</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">查看并编辑个人资料</p>
    </div>

    <div v-if="!auth.user" class="surface flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm" style="color: var(--color-text-secondary)">登录后可管理个人资料。</p>
      <RouterLink to="/login" class="btn btn-primary">去登录</RouterLink>
    </div>

    <template v-else>
      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
        {{ error }}
      </div>
      <div v-if="success" class="rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm">
        {{ success }}
      </div>

      <form class="surface space-y-4" @submit.prevent="handleSave">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="label">昵称</label>
            <input v-model="form.name" class="input" name="name" />
          </div>
          <div>
            <label class="label">邮箱</label>
            <input class="input opacity-70" :value="auth.user.email" disabled />
          </div>
          <div>
            <label class="label">学校</label>
            <input v-model="form.school" class="input" />
          </div>
          <div>
            <label class="label">专业</label>
            <input v-model="form.major" class="input" />
          </div>
          <div>
            <label class="label">年级</label>
            <input v-model="form.grade" class="input" />
          </div>
          <div>
            <label class="label">学号</label>
            <input v-model="form.studentId" class="input" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">头像 URL</label>
            <input v-model="form.avatarUrl" class="input" placeholder="https://..." />
          </div>
          <div class="sm:col-span-2">
            <label class="label">个人简介</label>
            <textarea v-model="form.bio" class="input min-h-[96px]" rows="3" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">升学目标</label>
            <input v-model="form.advancementTarget" class="input" placeholder="例如：考研" />
          </div>
        </div>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? '保存中…' : '保存资料' }}
        </button>
      </form>

      <div class="surface space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold">{{ needsSetPassword ? '设置密码' : '修改密码' }}</h2>
          <button type="button" class="btn btn-ghost text-sm" @click="showPassword = !showPassword">
            {{ showPassword ? '收起' : '展开' }}
          </button>
        </div>

        <form v-if="showPassword" class="space-y-3" @submit.prevent="handlePassword">
          <div v-if="passwordError" class="text-sm text-red-600">{{ passwordError }}</div>
          <div v-if="!needsSetPassword">
            <label class="label">当前密码</label>
            <input v-model="passwordForm.oldPassword" type="password" class="input" />
          </div>
          <div>
            <label class="label">新密码</label>
            <input v-model="passwordForm.newPassword" type="password" class="input" placeholder="至少 6 位" />
          </div>
          <div>
            <label class="label">确认新密码</label>
            <input v-model="passwordForm.confirmPassword" type="password" class="input" />
          </div>
          <button type="submit" class="btn btn-primary" :disabled="changingPassword">
            {{ changingPassword ? '提交中…' : needsSetPassword ? '设置密码' : '修改密码' }}
          </button>
        </form>
      </div>

      <div class="surface flex flex-wrap gap-3">
        <RouterLink to="/settings" class="btn btn-outline">系统设置</RouterLink>
        <button type="button" class="btn btn-ghost text-red-600" @click="onLogout">退出登录</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/api'
import { useAuthStore } from '../stores/auth'
import toast from '../utils/toast'

const auth = useAuthStore()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const showPassword = ref(false)
const changingPassword = ref(false)
const passwordError = ref('')

const form = reactive({
  name: '',
  avatarUrl: '',
  school: '',
  major: '',
  grade: '',
  studentId: '',
  bio: '',
  advancementTarget: '',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const needsSetPassword = computed(() => auth.user?.hasPassword === false)

async function init() {
  if (!auth.token) {
    loading.value = false
    return
  }
  try {
    const { data } = await api.get('/auth/me')
    const u = data?.user || auth.user
    if (u) {
      form.name = u.name || ''
      form.avatarUrl = u.avatarUrl || ''
      form.school = u.school || ''
      form.major = u.major || ''
      form.grade = u.grade || ''
      form.studentId = u.studentId || ''
      form.bio = u.bio || ''
      form.advancementTarget = u.advancementTarget ?? ''
      if (data?.user) auth.setUser(data.user)
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    const { data } = await api.put('/auth/me', { ...form })
    if (!data?.success) {
      error.value = data?.message || '保存失败'
      return
    }
    if (data.user) auth.setUser(data.user)
    success.value = '个人资料保存成功！'
    toast('保存成功', 'success')
    setTimeout(() => {
      success.value = ''
    }, 3000)
  } catch (e) {
    error.value = e?.response?.data?.message || '保存失败，请稍后再试'
  } finally {
    saving.value = false
  }
}

async function handlePassword() {
  passwordError.value = ''
  if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
    passwordError.value = '密码至少 6 位'
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = '两次输入的新密码不一致'
    return
  }
  if (!needsSetPassword.value && passwordForm.oldPassword === passwordForm.newPassword) {
    passwordError.value = '新密码不能与当前密码相同'
    return
  }

  changingPassword.value = true
  try {
    const payload = needsSetPassword.value
      ? { newPassword: passwordForm.newPassword }
      : {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }
    const { data } = await api.put('/auth/me/password', payload)
    if (!data?.success) {
      passwordError.value = data?.message || '操作失败'
      return
    }
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    showPassword.value = false
    if (needsSetPassword.value) {
      success.value = data.message || '密码设置成功'
      auth.setUser({ ...auth.user, hasPassword: true })
      toast('密码设置成功', 'success')
      return
    }
    toast('密码修改成功，请重新登录', 'success')
    setTimeout(() => auth.logout().then(() => router.push('/login')), 500)
  } catch (e) {
    passwordError.value = e?.response?.data?.message || '操作失败，请稍后再试'
  } finally {
    changingPassword.value = false
  }
}

async function onLogout() {
  await auth.logout()
  router.push('/login')
}

onMounted(init)
</script>
