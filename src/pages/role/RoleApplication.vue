<template>
  <div class="space-y-4 animate-rise-in max-w-xl">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">申请角色</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">申请成为出题负责人，由管理员审批</p>
    </div>

    <form class="surface space-y-3" @submit.prevent="submit">
      <div>
        <label class="label">申请角色</label>
        <select v-model="form.targetRole" class="input">
          <option value="question_manager">出题负责人</option>
        </select>
      </div>
      <div>
        <label class="label">申请理由 *</label>
        <textarea v-model="form.reason" class="input min-h-[100px]" rows="4" required />
      </div>
      <div v-if="err" class="text-sm text-red-600">{{ err }}</div>
      <button type="submit" class="btn btn-primary" :disabled="saving">提交申请</button>
    </form>

    <div class="surface space-y-2">
      <h2 class="font-semibold">我的申请</h2>
      <div v-for="a in apps" :key="a._id" class="text-sm flex justify-between gap-2 border-b py-2" style="border-color: var(--color-border)">
        <span>{{ a.targetRole || a.role }} · {{ a.status || 'pending' }}</span>
        <span class="text-xs" style="color: var(--color-text-tertiary)">{{ formatDate(a.createdAt) }}</span>
      </div>
      <p v-if="!apps.length" class="text-sm" style="color: var(--color-text-tertiary)">暂无申请记录</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { applyRole, getMyRoleApplications } from '../../api/v3/roleApplications'
import toast from '../../utils/toast'

const apps = ref([])
const saving = ref(false)
const err = ref('')
const form = reactive({
  targetRole: 'question_manager',
  reason: '',
})

function formatDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleString('zh-CN')
  } catch {
    return String(d)
  }
}

async function load() {
  try {
    const data = await getMyRoleApplications()
    apps.value = data?.items || data?.applications || (Array.isArray(data) ? data : [])
  } catch {
    apps.value = []
  }
}

async function submit() {
  err.value = ''
  if (!form.reason.trim()) {
    err.value = '请填写申请理由'
    return
  }
  saving.value = true
  try {
    await applyRole({
      targetRole: form.targetRole,
      reason: form.reason.trim(),
    })
    toast('申请已提交', 'success')
    form.reason = ''
    await load()
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '提交失败'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
