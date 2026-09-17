<template>
  <div class="space-y-6 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight" style="color: var(--color-text-primary)">
          知识图谱 · 节点管理
        </h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">
          维护课程知识点节点，可配合题库、AI 出题使用。
        </p>
      </div>
      <button type="button" class="btn btn-outline" :disabled="busy" @click="load">
        {{ busy ? '刷新中…' : '刷新列表' }}
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="surface space-y-3">
        <h2 class="font-semibold">导入节点</h2>
        <p class="text-sm" style="color: var(--color-text-secondary)">从 JSON 文件导入（支持 graph-export.json）</p>
        <button type="button" class="btn btn-primary" :disabled="busy" @click="doImport">选择文件</button>
      </div>
      <div class="surface space-y-3">
        <h2 class="font-semibold">导出节点</h2>
        <p class="text-sm" style="color: var(--color-text-secondary)">导出所有节点为 JSON</p>
        <button type="button" class="btn btn-primary" :disabled="busy" @click="doExport">立即导出</button>
      </div>
    </div>

    <div class="surface space-y-4">
      <h2 class="font-semibold">新增知识点节点</h2>
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div class="lg:col-span-2">
          <label class="label">Key（唯一标识）*</label>
          <input v-model="key" class="input" placeholder="例如：os-thread" />
        </div>
        <div class="lg:col-span-2">
          <label class="label">显示名称</label>
          <input v-model="name" class="input" placeholder="例如：进程与线程" />
        </div>
        <div class="flex items-end">
          <button type="button" class="btn btn-primary w-full" :disabled="busy" @click="addNode">
            新增节点
          </button>
        </div>
      </div>
    </div>

    <div class="surface p-0 overflow-hidden">
      <div class="px-4 py-3 flex items-center gap-3 border-b" style="border-color: var(--color-border)">
        <h2 class="font-semibold">节点列表</h2>
        <span class="text-xs px-2 py-0.5 rounded-full border" style="border-color: var(--color-border)">
          {{ nodes.length }} 个
        </span>
      </div>

      <div v-if="nodes.length > pageSize" class="flex items-center justify-between px-4 py-2 text-sm border-b" style="border-color: var(--color-border); color: var(--color-text-secondary)">
        <span>
          第 {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, nodes.length) }} 条
        </span>
        <div class="flex gap-2">
          <button type="button" class="btn btn-ghost" :disabled="page <= 1" @click="page--">上一页</button>
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="page >= Math.ceil(nodes.length / pageSize)"
            @click="page++"
          >
            下一页
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b text-left" style="border-color: var(--color-border)">
              <th class="px-4 py-3 w-14">#</th>
              <th class="px-4 py-3">Key</th>
              <th class="px-4 py-3">名称</th>
              <th class="px-4 py-3 w-36">掌握度 / 错题</th>
              <th class="px-4 py-3 w-24">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(x, i) in pagedNodes"
              :key="x.key || i"
              class="border-b hover:opacity-90"
              style="border-color: var(--color-border)"
            >
              <td class="px-4 py-3">{{ (page - 1) * pageSize + i + 1 }}</td>
              <td class="px-4 py-3">
                <code class="text-xs px-2 py-1 rounded border font-mono" style="border-color: var(--color-border)">
                  {{ x.key }}
                </code>
              </td>
              <td class="px-4 py-3 font-medium">{{ x.name || '未命名' }}</td>
              <td class="px-4 py-3">
                <template v-if="heatmapMap[x.key]">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="masteryClass(heatmapMap[x.key])">
                    {{ heatmapMap[x.key].practiceCount > 0 ? `${heatmapMap[x.key].masteryPercent}%` : '—' }}
                  </span>
                  <span v-if="heatmapMap[x.key].wrongCount > 0" class="ml-2 text-xs" style="color: var(--color-text-secondary)">
                    错 {{ heatmapMap[x.key].wrongCount }}
                  </span>
                </template>
                <span v-else class="text-xs" style="color: var(--color-text-tertiary)">—</span>
              </td>
              <td class="px-4 py-3">
                <button type="button" class="btn btn-ghost text-red-600" :disabled="busy" @click="removeNode(x.key)">
                  删除
                </button>
              </td>
            </tr>
            <tr v-if="!nodes.length">
              <td colspan="5" class="px-4 py-12 text-center" style="color: var(--color-text-tertiary)">
                暂无节点，可通过上方表单新增或导入 JSON
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { createNode, deleteNode, exportGraphRaw, importGraph, listNodes } from '../api/graph'
import { getGraphHeatmap } from '../api/v3/enhancedAnalytics'
import { getStoredToken } from '../api/api'
import { downloadFile } from '../utils/download'
import toast from '../utils/toast'

const pageSize = 50
const nodes = ref([])
const busy = ref(false)
const key = ref('')
const name = ref('')
const page = ref(1)
const heatmapMap = ref({})

const pagedNodes = computed(() =>
  nodes.value.slice((page.value - 1) * pageSize, page.value * pageSize),
)

function masteryClass(h) {
  const pct = h.masteryPercent
  if (pct >= 70) return 'bg-green-100 text-green-800'
  if (pct >= 40) return 'bg-amber-100 text-amber-800'
  if (h.practiceCount > 0) return 'bg-red-100 text-red-800'
  return 'bg-slate-100 text-slate-600'
}

async function load() {
  busy.value = true
  try {
    nodes.value = await listNodes()
    page.value = 1
    if (getStoredToken()) {
      try {
        const res = await getGraphHeatmap(90)
        if (res?.data && Array.isArray(res.data)) {
          heatmapMap.value = res.data.reduce((acc, n) => {
            acc[n.key] = n
            return acc
          }, {})
        }
      } catch {
        heatmapMap.value = {}
      }
    } else {
      heatmapMap.value = {}
    }
  } catch (err) {
    console.error(err)
    toast('加载失败，请检查网络或后端是否启动', 'error')
  } finally {
    busy.value = false
  }
}

async function addNode() {
  if (!key.value.trim()) {
    toast('请输入 key', 'warning')
    return
  }
  busy.value = true
  try {
    await createNode({ key: key.value.trim(), name: name.value.trim() })
    key.value = ''
    name.value = ''
    toast('节点创建成功', 'success')
    await load()
  } catch (err) {
    toast(err?.response?.data?.error || err.message || '创建失败', 'error')
  } finally {
    busy.value = false
  }
}

async function removeNode(k) {
  if (!confirm(`删除节点 ${k}？`)) return
  busy.value = true
  try {
    await deleteNode(k)
    toast('节点删除成功', 'success')
    await load()
  } catch {
    toast('删除失败，请重试', 'error')
  } finally {
    busy.value = false
  }
}

async function doExport() {
  busy.value = true
  try {
    const text = await exportGraphRaw()
    downloadFile('graph-export.json', text)
    toast('已导出 graph-export.json', 'success')
  } catch {
    toast('导出失败，请重试', 'error')
  } finally {
    busy.value = false
  }
}

function doImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    busy.value = true
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const list = Array.isArray(data.nodes) ? data.nodes : Array.isArray(data) ? data : []
      if (!list.length) throw new Error('文件中没有找到节点数据')
      await importGraph(list)
      toast(`导入成功，共导入 ${list.length} 个节点`, 'success')
      await load()
    } catch (err) {
      toast(err.message || '导入失败', 'error')
    } finally {
      busy.value = false
    }
  }
  input.click()
}

onMounted(load)
</script>
