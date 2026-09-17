<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">统计报表</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">生成系统统计并下载 JSON</p>
      </div>
      <RouterLink to="/admin" class="btn btn-ghost">返回后台</RouterLink>
    </div>

    <form class="surface space-y-3 max-w-xl" @submit.prevent="generate">
      <div>
        <label class="label">报表类型</label>
        <select v-model="form.type" class="input">
          <option value="daily">日报</option>
          <option value="weekly">周报</option>
          <option value="monthly">月报</option>
          <option value="custom">自定义区间</option>
        </select>
      </div>
      <div v-if="form.type === 'custom'" class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">开始</label>
          <input v-model="form.startDate" type="date" class="input" required />
        </div>
        <div>
          <label class="label">结束</label>
          <input v-model="form.endDate" type="date" class="input" required />
        </div>
      </div>
      <button type="submit" class="btn btn-primary" :disabled="busy">
        {{ busy ? '生成中…' : '生成并下载' }}
      </button>
    </form>

    <div v-if="preview" class="surface">
      <h2 class="font-semibold text-sm mb-2">预览</h2>
      <pre class="text-xs overflow-auto max-h-80 whitespace-pre-wrap" style="color: var(--color-text-secondary)">{{ preview }}</pre>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { generateSystemReport } from '../../api/admin'
import toast from '../../utils/toast'

const busy = ref(false)
const preview = ref('')
const form = reactive({ type: 'daily', startDate: '', endDate: '' })

async function generate() {
  busy.value = true
  try {
    const params = { type: form.type }
    if (form.type === 'custom') {
      params.startDate = new Date(form.startDate).toISOString()
      params.endDate = new Date(form.endDate).toISOString()
    }
    const data = await generateSystemReport(params)
    preview.value = JSON.stringify(data, null, 2)
    const blob = new Blob([preview.value], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${form.type}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('报表已下载', 'success')
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '生成失败', 'error')
  } finally {
    busy.value = false
  }
}
</script>
