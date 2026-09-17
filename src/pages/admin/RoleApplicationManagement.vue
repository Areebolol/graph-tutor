<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">角色申请审批</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">处理用户的出题负责人申请</p>
      </div>
      <RouterLink to="/admin" class="btn btn-ghost">返回后台</RouterLink>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <div v-else class="space-y-2">
      <div v-for="a in apps" :key="a._id" class="surface space-y-2">
        <div class="flex flex-wrap justify-between gap-2">
          <div>
            <p class="font-semibold text-sm">
              {{ a.user?.name || a.user?.email || a.applicantName || '用户' }}
              → {{ a.targetRole || a.role }}
            </p>
            <p class="text-sm mt-1" style="color: var(--color-text-secondary)">{{ a.reason }}</p>
            <p class="text-xs mt-1" style="color: var(--color-text-tertiary)">
              {{ a.status || 'pending' }} · {{ formatDate(a.createdAt) }}
            </p>
          </div>
          <div v-if="(a.status || 'pending') === 'pending'" class="flex gap-2 shrink-0">
            <button type="button" class="btn btn-primary text-xs" @click="decide(a, true)">通过</button>
            <button type="button" class="btn btn-ghost text-xs" @click="decide(a, false)">拒绝</button>
          </div>
        </div>
      </div>
      <div v-if="!apps.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">
        暂无申请
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import {
  approveRoleApplication,
  getRoleApplications,
  rejectRoleApplication,
} from '../../api/v3/roleApplications'
import toast from '../../utils/toast'

const loading = ref(false)
const err = ref('')
const apps = ref([])

function formatDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleString('zh-CN')
  } catch {
    return String(d)
  }
}

function normalizeList(data) {
  return data?.items || data?.applications || (Array.isArray(data) ? data : [])
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const data = await getRoleApplications({ status: 'pending', limit: 50 })
    apps.value = normalizeList(data)
  } catch (e) {
    try {
      const data = await getRoleApplications()
      apps.value = normalizeList(data)
    } catch (e2) {
      err.value = e2?.response?.data?.message || e2.message || '加载失败'
      apps.value = []
    }
  } finally {
    loading.value = false
  }
}

async function decide(a, approve) {
  try {
    if (approve) await approveRoleApplication(a._id)
    else await rejectRoleApplication(a._id)
    toast(approve ? '已通过' : '已拒绝', 'success')
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '操作失败', 'error')
  }
}

onMounted(load)
</script>
