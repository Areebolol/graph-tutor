<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">收藏夹</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">管理收藏的题目</p>
      </div>
      <button type="button" class="btn btn-primary" @click="createFolder">新建收藏夹</button>
    </div>

    <div class="grid md:grid-cols-[220px_1fr] gap-4">
      <div class="surface space-y-2">
        <button
          type="button"
          class="w-full text-left px-3 py-2 rounded-lg text-sm"
          :class="!folderId ? 'bg-blue-50 font-semibold' : ''"
          @click="folderId = ''; page = 1; loadItems()"
        >
          全部
        </button>
        <button
          v-for="f in folders"
          :key="f._id"
          type="button"
          class="w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between gap-2"
          :class="folderId === f._id ? 'bg-blue-50 font-semibold' : ''"
          @click="folderId = f._id; page = 1; loadItems()"
        >
          <span class="truncate">{{ f.name }}</span>
          <button type="button" class="text-red-500 text-xs shrink-0" @click.stop="removeFolder(f)">删</button>
        </button>
      </div>

      <div class="space-y-3">
        <div class="surface flex gap-2">
          <input
            v-model="search"
            class="input flex-1"
            placeholder="搜索题干"
            @keyup.enter="page = 1; loadItems()"
          />
          <button type="button" class="btn btn-outline" @click="page = 1; loadItems()">搜索</button>
        </div>

        <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
        <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>
        <div v-else class="space-y-2">
          <div v-for="item in items" :key="itemKey(item)" class="surface flex flex-wrap justify-between gap-3">
            <RouterLink
              :to="`/questions/${questionId(item)}/detail`"
              class="flex-1 min-w-0 text-sm font-medium line-clamp-2"
            >
              {{ item.question?.content || item.content || '（无题干）' }}
            </RouterLink>
            <div class="flex gap-2 shrink-0">
              <button type="button" class="btn btn-outline text-xs" @click="practice(item)">练习</button>
              <button type="button" class="btn btn-ghost text-xs text-red-600" @click="unfav(item)">取消</button>
            </div>
          </div>
          <div v-if="!items.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">
            暂无收藏
          </div>
        </div>

        <div v-if="totalPages > 1" class="flex justify-center gap-2">
          <button type="button" class="btn btn-ghost" :disabled="page <= 1" @click="page--; loadItems()">上一页</button>
          <span class="text-sm self-center">{{ page }} / {{ totalPages }}</span>
          <button type="button" class="btn btn-ghost" :disabled="page >= totalPages" @click="page++; loadItems()">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  createFavoriteFolder,
  deleteFavoriteFolder,
  getFavoriteFolders,
  getFavorites,
  removeFavorite,
} from '../api/v3/favorites'
import { usePracticeLaunchStore } from '../stores/quiz'
import toast from '../utils/toast'

const router = useRouter()
const launchStore = usePracticeLaunchStore()

const folders = ref([])
const folderId = ref('')
const items = ref([])
const loading = ref(false)
const err = ref('')
const search = ref('')
const page = ref(1)
const totalPages = ref(1)

function itemKey(item) {
  return `${questionId(item)}-${item.folderId || item.folder?._id || ''}`
}

function questionId(item) {
  return String(item.questionId || item.question?._id || item.question?.id || '')
}

async function loadFolders() {
  try {
    const res = await getFavoriteFolders()
    folders.value = res?.data || res?.folders || (Array.isArray(res) ? res : [])
  } catch {
    folders.value = []
  }
}

async function loadItems() {
  loading.value = true
  err.value = ''
  try {
    const res = await getFavorites({
      folderId: folderId.value || undefined,
      searchKeyword: search.value || undefined,
      page: page.value,
      limit: 20,
    })
    const data = res?.data || res
    items.value = data?.items || data?.data || []
    totalPages.value = data?.totalPages || data?.meta?.totalPages || 1
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    items.value = []
  } finally {
    loading.value = false
  }
}

async function createFolder() {
  const name = prompt('收藏夹名称')
  if (!name?.trim()) return
  try {
    await createFavoriteFolder({ name: name.trim() })
    toast('已创建', 'success')
    await loadFolders()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '创建失败', 'error')
  }
}

async function removeFolder(f) {
  if (!confirm(`删除收藏夹「${f.name}」？`)) return
  try {
    await deleteFavoriteFolder(f._id)
    if (folderId.value === f._id) folderId.value = ''
    toast('已删除', 'success')
    await loadFolders()
    await loadItems()
  } catch (e) {
    toast(e?.message || '删除失败', 'error')
  }
}

async function unfav(item) {
  const qid = questionId(item)
  const fid = item.folderId || item.folder?._id || folderId.value
  if (!qid || !fid) {
    toast('无法取消：缺少收藏夹信息', 'warning')
    return
  }
  try {
    await removeFavorite(qid, fid)
    toast('已取消收藏', 'success')
    await loadItems()
  } catch (e) {
    toast(e?.message || '操作失败', 'error')
  }
}

function practice(item) {
  const id = questionId(item)
  if (!id) return
  launchStore.launch([id], 'review')
  router.push('/quiz')
}

onMounted(async () => {
  await loadFolders()
  await loadItems()
})
</script>
