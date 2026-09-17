<template>
  <div class="space-y-4 animate-rise-in">
    <div>
      <h1 class="text-2xl font-bold tracking-tight" style="color: var(--color-text-primary)">系统设置</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">主题、学习偏好与账号绑定（纯前端本地保存）</p>
    </div>

    <div class="surface space-y-4">
      <h2 class="font-semibold">外观</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in themeOptions"
          :key="opt.value"
          type="button"
          class="btn"
          :class="theme === opt.value ? 'btn-primary' : 'btn-outline'"
          @click="setTheme(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
      <label class="flex items-center justify-between gap-4 py-2 border-t" style="border-color: var(--color-border)">
        <span>
          <span class="block text-sm font-medium">高对比度</span>
          <span class="text-xs" style="color: var(--color-text-secondary)">预留类名 contrast</span>
        </span>
        <input v-model="contrastOn" type="checkbox" class="h-4 w-4" @change="applyContrast" />
      </label>
    </div>

    <div class="surface space-y-3">
      <h2 class="font-semibold">学习偏好（本地）</h2>
      <label
        v-for="item in settingToggles"
        :key="item.key"
        class="flex items-center justify-between gap-4 py-2 border-b last:border-0"
        style="border-color: var(--color-border)"
      >
        <span>
          <span class="block text-sm font-medium">{{ item.label }}</span>
          <span class="text-xs" style="color: var(--color-text-secondary)">{{ item.desc }}</span>
        </span>
        <input
          type="checkbox"
          class="h-4 w-4"
          :checked="settings[item.key]"
          @change="toggleSetting(item.key, $event.target.checked)"
        />
      </label>
    </div>

    <div class="surface space-y-3">
      <h2 class="font-semibold">第三方账号绑定</h2>
      <p class="text-sm" style="color: var(--color-text-secondary)">
        纯前端演示：不会跳转真实 GitHub / 微信授权，绑定状态只保存在本机。
      </p>
      <div
        v-for="p in providers"
        :key="p.id"
        class="flex items-center justify-between gap-3 py-2 border-t"
        style="border-color: var(--color-border)"
      >
        <div>
          <p class="text-sm font-medium">{{ p.label }}</p>
          <p class="text-xs" style="color: var(--color-text-tertiary)">
            {{ binds[p.id] ? '已绑定' : '未绑定' }}
          </p>
        </div>
        <button
          type="button"
          class="btn text-xs"
          :class="binds[p.id] ? 'btn-outline' : 'btn-primary'"
          :disabled="binding === p.id"
          @click="toggleBind(p.id)"
        >
          {{ binding === p.id ? '处理中…' : binds[p.id] ? '解绑' : '绑定' }}
        </button>
      </div>
    </div>

    <div class="surface flex flex-wrap gap-3">
      <RouterLink to="/profile" class="btn btn-outline">个人中心</RouterLink>
      <RouterLink to="/home" class="btn btn-ghost">返回首页</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { bindOAuth, getOAuthBinds, unbindOAuth } from '../api/v3/oauth'
import { applyTheme, loadTheme } from '../utils/theme'
import toast from '../utils/toast'

const theme = ref('auto')
const contrastOn = ref(false)
const binding = ref('')
const binds = reactive({ github: false, wechat: false })
const settings = reactive({
  autoSave: true,
  showHints: true,
  compactMode: false,
  notifications: true,
  soundEnabled: false,
})

const themeOptions = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'auto', label: '跟随系统' },
]

const settingToggles = [
  { key: 'autoSave', label: '自动保存进度', desc: '练习过程中自动保存答题进度' },
  { key: 'showHints', label: '显示提示', desc: '在页面中显示帮助提示' },
  { key: 'compactMode', label: '紧凑模式', desc: '减少间距，显示更多内容' },
  { key: 'notifications', label: '启用通知', desc: '接收系统通知（本地开关）' },
  { key: 'soundEnabled', label: '声音提示', desc: '操作时播放提示音' },
]

const providers = [
  { id: 'github', label: 'GitHub' },
  { id: 'wechat', label: '微信' },
]

function setTheme(value) {
  theme.value = value
  applyTheme(value, contrastOn.value ? 'on' : 'off')
  toast('主题已更新', 'success')
}

function applyContrast() {
  applyTheme(theme.value, contrastOn.value ? 'on' : 'off')
  toast('对比度设置已保存', 'success')
}

function toggleSetting(key, value) {
  settings[key] = value
  localStorage.setItem('userSettings', JSON.stringify({ ...settings }))
  toast('设置已保存', 'success')
}

async function loadBinds() {
  try {
    const data = await getOAuthBinds()
    binds.github = Boolean(data?.github)
    binds.wechat = Boolean(data?.wechat)
  } catch {
    binds.github = false
    binds.wechat = false
  }
}

async function toggleBind(provider) {
  binding.value = provider
  try {
    const next = binds[provider]
      ? await unbindOAuth(provider)
      : await bindOAuth(provider)
    binds.github = Boolean(next?.github)
    binds.wechat = Boolean(next?.wechat)
    toast(binds[provider] ? `已绑定 ${provider}` : `已解绑 ${provider}`, 'success')
  } catch (e) {
    toast(e?.message || '操作失败', 'error')
  } finally {
    binding.value = ''
  }
}

onMounted(() => {
  const t = loadTheme()
  theme.value = t.theme
  contrastOn.value = t.contrast === 'on'
  try {
    const saved = localStorage.getItem('userSettings')
    if (saved) Object.assign(settings, JSON.parse(saved))
  } catch {
    /* ignore */
  }
  loadBinds()
})
</script>
