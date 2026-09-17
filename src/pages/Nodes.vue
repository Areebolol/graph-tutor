<template>
  <div class="space-y-4 animate-rise-in">
    <div>
      <h1 class="text-2xl font-bold tracking-tight" style="color: var(--color-text-primary)">知识点管理</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">
        拖拽行可调整顺序，松手后自动保存。
      </p>
    </div>

    <div class="surface space-y-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <input v-model="newKey" class="input flex-1" placeholder="key（唯一标识）" />
        <input v-model="newName" class="input flex-1" placeholder="知识点名称" />
        <button type="button" class="btn btn-primary" @click="add">新增</button>
        <button type="button" class="btn btn-ghost" @click="exportOrder">导出顺序</button>
        <button type="button" class="btn btn-ghost" @click="importOrder">导入顺序</button>
      </div>

      <div class="overflow-x-auto rounded-xl border" style="border-color: var(--color-border)">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-left" style="border-color: var(--color-border)">
              <th class="px-4 py-3 w-12">#</th>
              <th class="px-4 py-3">Key</th>
              <th class="px-4 py-3">名称</th>
              <th class="px-4 py-3 w-40">操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(x, i) in rows" :key="x.key">
              <tr
                draggable="true"
                class="border-b cursor-move hover:opacity-90"
                style="border-color: var(--color-border)"
                @dragstart="onDragStart(i)"
                @dragover.prevent
                @drop="onDrop(i)"
              >
                <td class="px-4 py-3 font-semibold">{{ i + 1 }}</td>
                <td class="px-4 py-3">
                  <code class="text-xs px-2 py-1 rounded border font-mono" style="border-color: var(--color-border)">
                    {{ x.key }}
                  </code>
                </td>
                <td class="px-4 py-3">{{ x.name || '-' }}</td>
                <td class="px-4 py-3 flex gap-2">
                  <button type="button" class="btn btn-ghost text-xs" @click="toggleNotes(x.key)">
                    {{ expanded === x.key ? '收起' : '笔记' }}
                  </button>
                  <button type="button" class="btn btn-ghost text-red-600 text-xs" @click="remove(x.key)">删除</button>
                </td>
              </tr>
              <tr v-if="expanded === x.key">
                <td colspan="4" class="px-4 py-4" style="background: var(--color-bg-secondary)">
                  <div class="space-y-2">
                    <div class="flex justify-between items-center">
                      <h4 class="font-semibold text-sm">知识点笔记</h4>
                      <button type="button" class="btn btn-outline text-xs" @click="startNote(x.key)">+ 添加笔记</button>
                    </div>
                    <div v-if="noteForm.nodeKey === x.key" class="space-y-2">
                      <input v-model="noteForm.title" class="input" placeholder="标题" />
                      <textarea v-model="noteForm.content" class="input" rows="3" placeholder="内容" />
                      <button type="button" class="btn btn-primary text-xs" @click="saveNote">保存笔记</button>
                    </div>
                    <div v-for="n in nodeNotes[x.key] || []" :key="n._id" class="text-sm rounded-lg p-3" style="background: var(--color-bg-primary)">
                      <p class="font-medium">{{ n.title }}</p>
                      <p class="whitespace-pre-wrap mt-1" style="color: var(--color-text-secondary)">{{ n.content }}</p>
                    </div>
                    <p v-if="!(nodeNotes[x.key] || []).length && noteForm.nodeKey !== x.key" class="text-xs" style="color: var(--color-text-tertiary)">
                      暂无笔记
                    </p>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="!rows.length">
              <td colspan="4" class="px-4 py-10 text-center" style="color: var(--color-text-tertiary)">
                暂无知识点
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { createNode, deleteNode, listNodes, reorderNodes } from '../api/graph'
import { createNote, getKnowledgeNotes } from '../api/v3/notes'
import { downloadFile } from '../utils/download'
import toast from '../utils/toast'

const rows = ref([])
const dragIndex = ref(null)
const newKey = ref('')
const newName = ref('')
const expanded = ref('')
const nodeNotes = reactive({})
const noteForm = reactive({ nodeKey: '', title: '', content: '' })

async function load() {
  try {
    rows.value = await listNodes()
  } catch {
    rows.value = []
  }
}

async function add() {
  if (!newKey.value.trim()) return
  try {
    await createNode({ key: newKey.value.trim(), name: newName.value.trim() })
    newKey.value = ''
    newName.value = ''
    await load()
    toast('已创建', 'success')
  } catch {
    toast('创建失败', 'error')
  }
}

async function remove(key) {
  if (!confirm('确认删除该知识点？')) return
  try {
    await deleteNode(key)
    await load()
    toast('已删除', 'success')
  } catch {
    toast('删除失败', 'error')
  }
}

function normalizeNotes(data) {
  return data?.items || data?.notes || (Array.isArray(data) ? data : [])
}

async function toggleNotes(key) {
  expanded.value = expanded.value === key ? '' : key
  if (expanded.value !== key) return
  try {
    nodeNotes[key] = normalizeNotes(await getKnowledgeNotes(key))
  } catch {
    nodeNotes[key] = []
  }
}

function startNote(key) {
  noteForm.nodeKey = key
  noteForm.title = ''
  noteForm.content = ''
}

async function saveNote() {
  if (!noteForm.title.trim() || !noteForm.content.trim()) {
    toast('请填写标题和内容', 'warning')
    return
  }
  try {
    await createNote({
      title: noteForm.title.trim(),
      content: noteForm.content.trim(),
      knowledgeNodeId: noteForm.nodeKey,
      type: 'knowledge',
    })
    toast('笔记已保存', 'success')
    const key = noteForm.nodeKey
    noteForm.nodeKey = ''
    nodeNotes[key] = normalizeNotes(await getKnowledgeNotes(key))
  } catch (e) {
    toast(e?.message || '保存失败', 'error')
  }
}

function onDragStart(i) {
  dragIndex.value = i
}

async function onDrop(i) {
  if (dragIndex.value === null || dragIndex.value === i) return
  const arr = [...rows.value]
  const [m] = arr.splice(dragIndex.value, 1)
  arr.splice(i, 0, m)
  dragIndex.value = null
  rows.value = arr
  try {
    await reorderNodes(arr.map((x, idx) => ({ key: x.key, order: idx })))
    toast('已保存顺序', 'success')
  } catch {
    toast('保存顺序失败', 'error')
  }
}

function exportOrder() {
  const snapshot = rows.value.map((x, idx) => ({ key: x.key, name: x.name || '', order: idx }))
  downloadFile('nodes-order.json', JSON.stringify(snapshot, null, 2))
}

function importOrder() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'
  input.onchange = async () => {
    try {
      const text = await input.files[0].text()
      const arr = JSON.parse(text)
      if (!Array.isArray(arr)) throw new Error('格式错误')
      await reorderNodes(
        arr.map((x, i) => ({ key: x.key, order: typeof x.order === 'number' ? x.order : i })),
      )
      await load()
      toast('已导入顺序', 'success')
    } catch {
      toast('导入顺序失败', 'error')
    }
  }
  input.click()
}

onMounted(load)
</script>
