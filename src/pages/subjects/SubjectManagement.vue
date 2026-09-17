<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">学科管理</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">维护学科树；出题负责人与管理员可编辑</p>
      </div>
      <button v-if="canManage" type="button" class="btn btn-primary" @click="openCreate">新建学科</button>
    </div>

    <form v-if="showForm && canManage" class="surface space-y-3 max-w-xl" @submit.prevent="save">
      <h2 class="font-semibold">{{ editingCode ? '编辑学科' : '新建学科' }}</h2>
      <div>
        <label class="label">代码 *</label>
        <input v-model="form.code" class="input" :disabled="!!editingCode" required />
      </div>
      <div>
        <label class="label">名称 *</label>
        <input v-model="form.name" class="input" required />
      </div>
      <div>
        <label class="label">层级</label>
        <input v-model.number="form.level" type="number" min="1" max="5" class="input" />
      </div>
      <div>
        <label class="label">父学科代码</label>
        <input v-model="form.parentId" class="input" placeholder="可选" />
      </div>
      <div v-if="formErr" class="text-sm text-red-600">{{ formErr }}</div>
      <div class="flex gap-2">
        <button type="submit" class="btn btn-primary" :disabled="saving">保存</button>
        <button type="button" class="btn btn-ghost" @click="showForm = false">取消</button>
      </div>
    </form>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <div v-else class="surface space-y-2">
      <div
        v-for="s in flatList"
        :key="s.code"
        class="flex flex-wrap justify-between gap-2 py-2 border-b"
        style="border-color: var(--color-border)"
      >
        <div :style="{ paddingLeft: `${((s.level || 1) - 1) * 16}px` }">
          <span class="font-semibold text-sm">{{ s.name }}</span>
          <span class="text-xs ml-2" style="color: var(--color-text-tertiary)">{{ s.code }}</span>
        </div>
        <div v-if="canManage" class="flex gap-2">
          <button type="button" class="btn btn-ghost text-xs" @click="openEdit(s)">编辑</button>
          <button type="button" class="btn btn-ghost text-xs text-red-600" @click="remove(s)">删除</button>
        </div>
      </div>
      <p v-if="!flatList.length" class="text-sm text-center py-4" style="color: var(--color-text-tertiary)">暂无学科</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { createSubject, deleteSubject, getSubjectTree, updateSubject } from '../../api/v3/subjects'
import { useAuthStore } from '../../stores/auth'
import { flattenSubjects } from '../../utils/practiceSubmit'
import { canManageResources } from '../../utils/role'
import toast from '../../utils/toast'

const auth = useAuthStore()
const canManage = computed(() => canManageResources(auth.user))

const loading = ref(false)
const saving = ref(false)
const err = ref('')
const formErr = ref('')
const tree = ref([])
const showForm = ref(false)
const editingCode = ref('')
const form = reactive({ code: '', name: '', level: 1, parentId: '' })

const flatList = computed(() => flattenSubjects(tree.value))

function openCreate() {
  editingCode.value = ''
  form.code = ''
  form.name = ''
  form.level = 1
  form.parentId = ''
  formErr.value = ''
  showForm.value = true
}

function openEdit(s) {
  editingCode.value = s.code
  form.code = s.code
  form.name = s.name || ''
  form.level = s.level || 1
  form.parentId = s.parentId || s.parentCode || ''
  formErr.value = ''
  showForm.value = true
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    tree.value = await getSubjectTree()
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    tree.value = []
  } finally {
    loading.value = false
  }
}

async function save() {
  formErr.value = ''
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      level: form.level,
      parentId: form.parentId.trim() || undefined,
    }
    if (editingCode.value) {
      await updateSubject(editingCode.value, payload)
      toast('已更新', 'success')
    } else {
      await createSubject({ code: form.code.trim(), ...payload })
      toast('已创建', 'success')
    }
    showForm.value = false
    await load()
  } catch (e) {
    formErr.value = e?.response?.data?.message || e.message || '保存失败'
  } finally {
    saving.value = false
  }
}

async function remove(s) {
  if (!confirm(`删除学科「${s.name}」？`)) return
  try {
    await deleteSubject(s.code)
    toast('已删除', 'success')
    await load()
  } catch (e) {
    toast(e?.message || '删除失败', 'error')
  }
}

onMounted(load)
</script>
