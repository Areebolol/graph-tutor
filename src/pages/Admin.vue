<template>
  <div class="space-y-4 animate-rise-in">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">管理后台</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">系统概览、备份与管理入口</p>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载统计…</div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div v-for="card in cards" :key="card.label" class="surface text-center">
        <p class="text-2xl font-bold" style="color: var(--color-primary-deep)">{{ card.value }}</p>
        <p class="text-xs mt-1" style="color: var(--color-text-secondary)">{{ card.label }}</p>
      </div>
    </div>

    <div class="surface space-y-3">
      <h2 class="font-semibold">全量备份</h2>
      <p class="text-sm" style="color: var(--color-text-secondary)">
        导出学科 / 知识点 / 题库题目 / 作答记录；或从 JSON 导入恢复。
      </p>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn btn-primary" :disabled="exporting" @click="doExport">
          {{ exporting ? '导出中…' : '导出备份 JSON' }}
        </button>
        <label class="btn btn-outline cursor-pointer">
          {{ importing ? '导入中…' : '导入备份文件' }}
          <input type="file" accept="application/json,.json" class="hidden" :disabled="importing" @change="doImport" />
        </label>
      </div>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="surface block hover:opacity-95 space-y-1"
      >
        <h2 class="font-semibold">{{ link.title }}</h2>
        <p class="text-sm" style="color: var(--color-text-secondary)">{{ link.desc }}</p>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { exportFullBackup, getSystemStats, importFullBackup } from '../api/admin'
import toast from '../utils/toast'

const loading = ref(true)
const exporting = ref(false)
const importing = ref(false)
const stats = ref({})

const cards = computed(() => {
  const s = stats.value || {}
  return [
    { label: '用户', value: s.users ?? s.userCount ?? s.totalUsers ?? '—' },
    { label: '题目', value: s.questions ?? s.questionCount ?? s.totalQuestions ?? '—' },
    { label: '题库', value: s.banks ?? s.bankCount ?? s.totalBanks ?? '—' },
    { label: '作答', value: s.records ?? s.recordCount ?? s.totalRecords ?? '—' },
  ]
})

const links = [
  { to: '/admin/users', title: '用户管理', desc: '搜索用户并修改角色' },
  { to: '/admin/operation-logs', title: '操作日志', desc: '筛选查看操作记录' },
  { to: '/admin/reports', title: '统计报表', desc: '生成并下载报表' },
  { to: '/admin/role-applications', title: '角色申请', desc: '审批用户角色申请' },
  { to: '/subjects', title: '学科管理', desc: '学科树 CRUD' },
  { to: '/ai', title: 'AI 出题', desc: '按学科生成题目' },
  { to: '/banks', title: '题库', desc: '题库与题目' },
]

async function doExport() {
  exporting.value = true
  try {
    const data = await exportFullBackup()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `graphtutor-backup-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('备份已下载', 'success')
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '导出失败', 'error')
  } finally {
    exporting.value = false
  }
}

async function doImport(ev) {
  const file = ev.target?.files?.[0]
  if (!file) return
  importing.value = true
  try {
    const text = await file.text()
    const payload = JSON.parse(text)
    await importFullBackup(payload)
    toast('导入成功', 'success')
    stats.value = (await getSystemStats()) || {}
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '导入失败', 'error')
  } finally {
    importing.value = false
    ev.target.value = ''
  }
}

onMounted(async () => {
  try {
    stats.value = (await getSystemStats()) || {}
  } catch {
    stats.value = {}
  } finally {
    loading.value = false
  }
})
</script>
