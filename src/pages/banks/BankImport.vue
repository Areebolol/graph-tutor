<template>
  <div class="space-y-4 animate-rise-in max-w-2xl">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">题库导入</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">
          选择 JSON 文件预览后导入（纯前端写入本地演示数据）
        </p>
      </div>
      <RouterLink to="/banks" class="btn btn-ghost">返回题库</RouterLink>
    </div>

    <div class="surface space-y-4">
      <div>
        <label class="label">JSON 文件</label>
        <input type="file" accept=".json,application/json" class="input" @change="onFile" />
        <p class="text-xs mt-1" style="color: var(--color-text-tertiary)">
          格式：数组，或 <code>{ "banks": [ { "name", "subjectCode", "description", "questions?" } ] }</code>
        </p>
      </div>
      <label class="flex items-center gap-2 text-sm">
        <input v-model="asPublic" type="checkbox" />
        导入为公开题库
      </label>
      <div v-if="err" class="text-sm text-red-600">{{ err }}</div>
    </div>

    <div v-if="preview.length" class="surface space-y-3">
      <h2 class="font-semibold">预览（{{ preview.length }} 个题库）</h2>
      <div v-for="(b, i) in preview" :key="i" class="border-b pb-2" style="border-color: var(--color-border)">
        <p class="font-medium">{{ b.name || '未命名题库' }}</p>
        <p class="text-xs" style="color: var(--color-text-tertiary)">
          学科 {{ b.subjectCode || '—' }} · 题目 {{ (b.questions || []).length }} 道
        </p>
      </div>
      <button type="button" class="btn btn-primary" :disabled="importing" @click="doImport">
        {{ importing ? '导入中…' : '确认导入' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createBank } from '../../api/v3/questionBanks'
import { createQuestion } from '../../api/v3/questions'
import toast from '../../utils/toast'

const router = useRouter()
const err = ref('')
const preview = ref([])
const asPublic = ref(true)
const importing = ref(false)

function onFile(e) {
  const file = e.target.files?.[0]
  err.value = ''
  preview.value = []
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const json = JSON.parse(String(reader.result || '{}'))
      const list = Array.isArray(json) ? json : json.banks || json.data || []
      if (!Array.isArray(list) || !list.length) throw new Error('文件中没有题库数组')
      preview.value = list
    } catch (ex) {
      err.value = ex.message || 'JSON 解析失败'
    }
  }
  reader.readAsText(file)
}

async function doImport() {
  if (!preview.value.length) return
  importing.value = true
  try {
    for (const raw of preview.value) {
      const bank = await createBank({
        name: raw.name || '导入题库',
        subjectCode: raw.subjectCode || '',
        description: raw.description || '',
        isPublic: asPublic.value,
      })
      const qs = raw.questions || []
      for (const q of qs) {
        await createQuestion({
          ...q,
          bankId: bank._id || bank.id,
          content: q.content || q.title,
        })
      }
    }
    toast('导入完成', 'success')
    router.push('/banks')
  } catch (e) {
    toast(e?.message || '导入失败', 'error')
  } finally {
    importing.value = false
  }
}
</script>
