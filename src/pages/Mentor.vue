<template>
  <div class="space-y-4 animate-rise-in">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">师徒关系</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">向好友申请拜师，或处理收到的申请</p>
    </div>

    <form class="surface flex flex-wrap gap-2 items-end" @submit.prevent="apply">
      <div class="flex-1 min-w-[14rem]">
        <label class="label">选择好友作为师傅</label>
        <select v-model="masterId" class="input">
          <option value="">请选择</option>
          <option v-for="f in friends" :key="uid(f)" :value="uid(f)">
            {{ displayName(f) }}
          </option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary" :disabled="applying || !masterId">申请拜师</button>
    </form>

    <section class="space-y-2">
      <h2 class="font-semibold text-sm">待处理申请</h2>
      <div v-if="appsLoading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
      <div v-else class="space-y-2">
        <div v-for="a in apps" :key="a._id" class="surface flex flex-wrap justify-between gap-2">
          <p class="text-sm">
            {{ a.apprentice?.name || a.student?.name || a.from?.name || '申请人' }}
            → {{ a.master?.name || a.to?.name || '师傅' }}
          </p>
          <div class="flex gap-2">
            <button type="button" class="btn btn-primary text-xs" @click="decide(a, true)">接受</button>
            <button type="button" class="btn btn-ghost text-xs" @click="decide(a, false)">拒绝</button>
          </div>
        </div>
        <div v-if="!apps.length" class="surface text-sm" style="color: var(--color-text-tertiary)">暂无申请</div>
      </div>
    </section>

    <section class="space-y-2">
      <h2 class="font-semibold text-sm">已建立关系</h2>
      <div v-if="relLoading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
      <div v-else class="space-y-2">
        <div v-for="r in relations" :key="r._id" class="surface text-sm">
          {{ r.master?.name || r.teacher?.name || '师傅' }}
          ↔
          {{ r.apprentice?.name || r.student?.name || '徒弟' }}
          · {{ r.status || 'active' }}
        </div>
        <div v-if="!relations.length" class="surface text-sm" style="color: var(--color-text-tertiary)">暂无关系</div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getFriends } from '../api/v3/friends'
import {
  acceptMentorApplication,
  applyMentor,
  getMentorApplications,
  getMentorRelations,
  rejectMentorApplication,
} from '../api/v3/mentor'
import toast from '../utils/toast'

const friends = ref([])
const masterId = ref('')
const applying = ref(false)
const apps = ref([])
const relations = ref([])
const appsLoading = ref(false)
const relLoading = ref(false)

function uid(f) {
  return f?.user?._id || f?.friend?._id || f?._id || f?.userId || ''
}

function displayName(f) {
  const u = f?.user || f?.friend || f
  return u?.name || u?.email || '好友'
}

function normalizeList(data) {
  return data?.items || data?.relations || data?.applications || (Array.isArray(data) ? data : [])
}

async function loadFriends() {
  try {
    const data = await getFriends()
    friends.value = Array.isArray(data) ? data : data?.friends || data?.items || []
  } catch {
    friends.value = []
  }
}

async function loadApps() {
  appsLoading.value = true
  try {
    apps.value = normalizeList(await getMentorApplications())
  } catch {
    apps.value = []
  } finally {
    appsLoading.value = false
  }
}

async function loadRels() {
  relLoading.value = true
  try {
    relations.value = normalizeList(await getMentorRelations())
  } catch {
    relations.value = []
  } finally {
    relLoading.value = false
  }
}

async function apply() {
  applying.value = true
  try {
    await applyMentor(masterId.value)
    toast('已发送申请', 'success')
    masterId.value = ''
    await loadApps()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '申请失败', 'error')
  } finally {
    applying.value = false
  }
}

async function decide(a, ok) {
  try {
    if (ok) await acceptMentorApplication(a._id)
    else await rejectMentorApplication(a._id)
    toast(ok ? '已接受' : '已拒绝', 'success')
    await Promise.all([loadApps(), loadRels()])
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '操作失败', 'error')
  }
}

onMounted(() => {
  loadFriends()
  loadApps()
  loadRels()
})
</script>
