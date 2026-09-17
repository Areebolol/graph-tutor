<template>
  <div class="space-y-4 animate-rise-in max-w-xl">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">{{ isEdit ? '编辑题库' : '新建题库' }}</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">名称必填；建议选择学科</p>
    </div>

    <div v-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <form class="surface space-y-4" @submit.prevent="save">
      <div>
        <label class="label">名称 *</label>
        <input v-model="form.name" class="input" required maxlength="100" />
      </div>
      <div>
        <label class="label">学科</label>
        <select v-model="form.subjectCode" class="input">
          <option value="">未指定</option>
          <option v-for="s in flatSubjects" :key="s.code" :value="s.code">{{ s.name }}</option>
        </select>
      </div>
      <div>
        <label class="label">描述</label>
        <textarea v-model="form.description" class="input min-h-[96px]" rows="3" />
      </div>
      <label class="flex items-center gap-2 text-sm">
        <input v-model="form.isPublic" type="checkbox" class="h-4 w-4" />
        公开题库
      </label>
      <div class="flex gap-2">
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? '保存中…' : '保存' }}
        </button>
        <RouterLink to="/banks" class="btn btn-ghost">取消</RouterLink>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createBank, getBank, updateBank } from '../../api/v3/questionBanks'
import { getSubjectTree } from '../../api/v3/subjects'
import { flattenSubjects } from '../../utils/practiceSubmit'
import toast from '../../utils/toast'

const route = useRoute()
const router = useRouter()
const bankId = computed(() => route.params.id)
const isEdit = computed(() => Boolean(bankId.value))

const subjects = ref([])
const flatSubjects = computed(() => flattenSubjects(subjects.value))
const saving = ref(false)
const err = ref('')
const form = reactive({
  name: '',
  subjectCode: '',
  description: '',
  isPublic: true,
})

async function save() {
  err.value = ''
  if (!form.name.trim()) {
    err.value = '请填写题库名称'
    return
  }
  if (!form.subjectCode && !confirm('未选择学科，确认继续？')) return

  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      subjectCode: form.subjectCode || undefined,
      description: form.description.trim(),
      isPublic: form.isPublic,
    }
    if (isEdit.value) {
      await updateBank(bankId.value, payload)
      toast('题库已更新', 'success')
      router.replace(`/banks/${bankId.value}`)
    } else {
      const created = await createBank(payload)
      toast('题库已创建', 'success')
      router.replace(`/banks/${created._id}`)
    }
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '保存失败'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    subjects.value = await getSubjectTree()
  } catch {
    subjects.value = []
  }
  if (isEdit.value) {
    try {
      const bank = await getBank(bankId.value)
      form.name = bank.name || ''
      form.subjectCode =
        typeof bank.subjectCode === 'object' ? bank.subjectCode?.code || '' : bank.subjectCode || ''
      form.description = bank.description || ''
      form.isPublic = bank.isPublic !== false
    } catch (e) {
      err.value = e?.message || '加载题库失败'
    }
  }
})
</script>
