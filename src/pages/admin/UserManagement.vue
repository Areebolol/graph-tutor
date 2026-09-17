<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">用户管理</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">搜索用户并调整角色</p>
      </div>
      <RouterLink to="/admin" class="btn btn-ghost">返回后台</RouterLink>
    </div>

    <div class="surface flex flex-wrap gap-3 items-end">
      <label class="text-sm flex-1 min-w-[160px]">
        <span class="label">搜索</span>
        <input v-model="search" class="input" placeholder="邮箱 / 昵称" @keyup.enter="page = 1; load()" />
      </label>
      <label class="text-sm">
        <span class="label">角色</span>
        <select v-model="role" class="input" @change="page = 1; load()">
          <option value="">全部</option>
          <option value="student">学习者</option>
          <option value="question_manager">出题负责人</option>
          <option value="admin">管理员</option>
        </select>
      </label>
      <button type="button" class="btn btn-outline" :disabled="loading" @click="load">刷新</button>
    </div>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <div v-else class="surface overflow-x-auto">
      <table class="w-full text-sm min-w-[480px]">
        <thead>
          <tr class="text-left border-b" style="border-color: var(--color-border); color: var(--color-text-secondary)">
            <th class="py-2 pr-3">用户</th>
            <th class="py-2 pr-3">邮箱</th>
            <th class="py-2 pr-3">角色</th>
            <th class="py-2">注册</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in rows" :key="u._id" class="border-b" style="border-color: var(--color-border)">
            <td class="py-2 pr-3 font-medium">{{ u.name || '—' }}</td>
            <td class="py-2 pr-3">{{ u.email }}</td>
            <td class="py-2 pr-3">
              <select
                class="input py-1 text-sm"
                :value="normalizeRole(u.role)"
                :disabled="savingId === u._id"
                @change="onRoleChange(u, $event.target.value)"
              >
                <option value="student">学习者</option>
                <option value="question_manager">出题负责人</option>
                <option value="admin">管理员</option>
              </select>
            </td>
            <td class="py-2 text-xs" style="color: var(--color-text-tertiary)">
              {{ formatDate(u.createdAt) }}
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!rows.length" class="text-sm py-6 text-center" style="color: var(--color-text-tertiary)">暂无用户</p>
    </div>

    <div v-if="meta.totalPages > 1" class="flex justify-center gap-2">
      <button type="button" class="btn btn-ghost" :disabled="page <= 1" @click="page--; load()">上一页</button>
      <span class="text-sm self-center">{{ page }} / {{ meta.totalPages }}</span>
      <button type="button" class="btn btn-ghost" :disabled="page >= meta.totalPages" @click="page++; load()">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getUsers, updateUserRole } from '../../api/users'
import toast from '../../utils/toast'

const loading = ref(false)
const err = ref('')
const rows = ref([])
const page = ref(1)
const search = ref('')
const role = ref('')
const savingId = ref('')
const meta = reactive({ totalPages: 1 })

function normalizeRole(r) {
  return r === 'user' ? 'student' : r || 'student'
}

function formatDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('zh-CN')
  } catch {
    return String(d)
  }
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const res = await getUsers({
      page: page.value,
      limit: 20,
      search: search.value || undefined,
      role: role.value || undefined,
    })
    rows.value = res.data || []
    Object.assign(meta, res.meta || {})
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function onRoleChange(u, nextRole) {
  if (!u._id || normalizeRole(u.role) === nextRole) return
  if (!confirm(`将 ${u.email} 的角色改为 ${nextRole}？`)) {
    await load()
    return
  }
  savingId.value = u._id
  try {
    await updateUserRole(u._id, nextRole)
    toast('角色已更新', 'success')
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '更新失败', 'error')
    await load()
  } finally {
    savingId.value = ''
  }
}

onMounted(load)
</script>
