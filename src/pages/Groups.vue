<template>
  <div class="space-y-4 animate-rise-in">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">学习群组</h1>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">创建或加入学习小组</p>
      </div>
      <button type="button" class="btn btn-primary" @click="showCreate = !showCreate">
        {{ showCreate ? '收起' : '新建群组' }}
      </button>
    </div>

    <form class="surface flex flex-wrap gap-2 items-end" @submit.prevent="join">
      <div class="flex-1 min-w-[12rem]">
        <label class="label">邀请码加入</label>
        <input v-model="joinCode" class="input" placeholder="输入群组代码" />
      </div>
      <button type="submit" class="btn btn-outline" :disabled="joining">{{ joining ? '加入中…' : '加入' }}</button>
    </form>

    <form v-if="showCreate" class="surface space-y-3 max-w-xl" @submit.prevent="create">
      <div>
        <label class="label">名称 *</label>
        <input v-model="form.name" class="input" required />
      </div>
      <div>
        <label class="label">描述</label>
        <textarea v-model="form.description" class="input" rows="2" />
      </div>
      <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? '创建中…' : '创建' }}</button>
    </form>

    <div v-if="loading" class="surface text-sm" style="color: var(--color-text-secondary)">加载中…</div>
    <div v-else-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>
    <div v-else class="space-y-2">
      <div v-for="g in groups" :key="g._id" class="surface flex flex-wrap justify-between gap-3">
        <div>
          <h2 class="font-semibold">{{ g.name }}</h2>
          <p class="text-sm mt-1" style="color: var(--color-text-secondary)">{{ g.description || '无描述' }}</p>
          <p class="text-xs mt-1" style="color: var(--color-text-tertiary)">
            代码 {{ g.code || g.inviteCode || '—' }} · 成员 {{ g.memberCount ?? g.members?.length ?? '—' }}
          </p>
        </div>
        <div class="flex gap-2 shrink-0">
          <button type="button" class="btn btn-ghost text-xs" @click="select(g)">详情</button>
          <button type="button" class="btn btn-ghost text-xs text-red-600" @click="remove(g)">删除</button>
        </div>
      </div>
      <div v-if="!groups.length" class="surface text-center text-sm" style="color: var(--color-text-tertiary)">暂无群组</div>
    </div>

    <div v-if="detail" class="surface space-y-4">
      <div class="flex justify-between gap-2">
        <h2 class="font-semibold">{{ detail.name }}</h2>
        <button type="button" class="btn btn-ghost text-xs" @click="detail = null">关闭</button>
      </div>

      <div class="flex flex-wrap gap-1">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          class="btn text-xs"
          :class="tab === t.id ? 'btn-primary' : 'btn-outline'"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </div>

      <div v-if="tab === 'members'" class="space-y-2">
        <div
          v-for="m in detail.members || []"
          :key="m._id || m.userId"
          class="flex justify-between text-sm border-t pt-2"
          style="border-color: var(--color-border)"
        >
          <span>{{ m.user?.name || m.name || m.userId || '成员' }} · {{ m.role || 'member' }}</span>
          <button type="button" class="text-xs text-red-600" @click="kick(m)">移除</button>
        </div>
      </div>

      <div v-else-if="tab === 'banks'" class="space-y-2">
        <label v-for="b in banks" :key="b._id" class="flex items-center gap-2 text-sm">
          <input type="checkbox" :checked="isLinked(b._id)" @change="toggleBank(b._id, $event.target.checked)" />
          {{ b.name }}
        </label>
        <p v-if="!banks.length" class="text-sm" style="color: var(--color-text-tertiary)">暂无题库</p>
      </div>

      <div v-else-if="tab === 'leaderboard'" class="space-y-2 text-sm">
        <div v-for="(row, i) in memberBoard" :key="row.userId || i" class="flex justify-between border-b py-2" style="border-color: var(--color-border)">
          <span>{{ i + 1 }}. {{ row.name }}</span>
          <span>{{ row.value }}</span>
        </div>
      </div>

      <div v-else-if="tab === 'practice'" class="space-y-2">
        <p class="text-sm" style="color: var(--color-text-secondary)">从关联题库开始共同练习</p>
        <RouterLink to="/quiz" class="btn btn-primary text-sm">去练习</RouterLink>
      </div>

      <div v-else-if="tab === 'studyRoom'" class="space-y-3">
        <div v-for="c in detail.studyRoom || []" :key="c._id" class="text-sm border-b py-2" style="border-color: var(--color-border)">
          <span class="font-medium">{{ c.userName }}</span>
          <span class="ml-2" style="color: var(--color-text-secondary)">{{ c.content }}</span>
        </div>
        <form class="flex gap-2" @submit.prevent="postRoom">
          <input v-model="roomText" class="input flex-1" placeholder="说点什么…" />
          <button type="submit" class="btn btn-primary">发送</button>
        </form>
      </div>

      <div v-else-if="tab === 'sharedQuestions'" class="space-y-2 text-sm">
        <p v-for="id in detail.sharedQuestionIds || []" :key="id">
          <RouterLink :to="`/questions/${id}/detail`" class="hover:underline">{{ questionTitle(id) }}</RouterLink>
        </p>
        <p v-if="!(detail.sharedQuestionIds || []).length" style="color: var(--color-text-tertiary)">暂无小组题目</p>
      </div>

      <div v-else-if="tab === 'assignments'" class="space-y-3">
        <div v-for="a in detail.assignments || []" :key="a._id" class="text-sm border-b py-2" style="border-color: var(--color-border)">
          <p class="font-medium">{{ a.title }}</p>
          <p class="text-xs" style="color: var(--color-text-tertiary)">截止 {{ String(a.dueAt || '').slice(0, 10) }}</p>
        </div>
        <form class="flex flex-wrap gap-2" @submit.prevent="addAssignment">
          <input v-model="asgTitle" class="input flex-1 min-w-[10rem]" placeholder="作业标题" required />
          <button type="submit" class="btn btn-outline">布置</button>
        </form>
      </div>

      <div v-else-if="tab === 'settings'" class="space-y-3">
        <div>
          <label class="label">描述</label>
          <textarea v-model="settingDesc" class="input" rows="3" />
        </div>
        <p class="text-sm">邀请码 <code>{{ detail.code }}</code></p>
        <button type="button" class="btn btn-primary" @click="saveSettings">保存设置</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { getBanks } from '../api/v3/questionBanks'
import { getQuestions } from '../api/v3/questions'
import { getLeaderboard } from '../api/v3/leaderboard'
import {
  createGroup,
  deleteGroup,
  getGroup,
  getGroups,
  joinGroupByCode,
  removeMemberFromGroup,
  updateGroup,
} from '../api/v3/groups'
import { useAuthStore } from '../stores/auth'
import toast from '../utils/toast'

const auth = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const joining = ref(false)
const err = ref('')
const groups = ref([])
const showCreate = ref(false)
const joinCode = ref('')
const detail = ref(null)
const tab = ref('members')
const banks = ref([])
const questions = ref([])
const board = ref([])
const roomText = ref('')
const asgTitle = ref('')
const settingDesc = ref('')
const form = reactive({ name: '', description: '' })

const tabs = computed(() => [
  { id: 'members', label: `成员 (${detail.value?.members?.length || 0})` },
  { id: 'banks', label: `关联题库 (${detail.value?.bankIds?.length || 0})` },
  { id: 'leaderboard', label: '排行榜' },
  { id: 'practice', label: '共同练习' },
  { id: 'studyRoom', label: '自习室' },
  { id: 'sharedQuestions', label: '小组题库' },
  { id: 'assignments', label: '作业' },
  { id: 'settings', label: '设置' },
])

const memberBoard = computed(() => {
  const ids = new Set((detail.value?.members || []).map((m) => String(m.userId || m.user?._id)))
  return board.value.filter((r) => ids.has(String(r.userId || r._id)))
})

function normalizeList(data) {
  return data?.items || data?.groups || (Array.isArray(data) ? data : [])
}

function isLinked(id) {
  return (detail.value?.bankIds || []).includes(id)
}

function questionTitle(id) {
  const q = questions.value.find((x) => x._id === id || x.id === id)
  return q?.content || id
}

async function persistDetail(patch) {
  const next = { ...detail.value, ...patch }
  detail.value = await updateGroup(detail.value._id, next)
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const data = await getGroups()
    groups.value = normalizeList(data)
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '加载失败'
    groups.value = []
  } finally {
    loading.value = false
  }
}

async function create() {
  saving.value = true
  try {
    await createGroup({ name: form.name, description: form.description })
    toast('已创建', 'success')
    form.name = ''
    form.description = ''
    showCreate.value = false
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '创建失败', 'error')
  } finally {
    saving.value = false
  }
}

async function join() {
  if (!joinCode.value.trim()) return
  joining.value = true
  try {
    await joinGroupByCode(joinCode.value.trim())
    toast('已加入', 'success')
    joinCode.value = ''
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '加入失败', 'error')
  } finally {
    joining.value = false
  }
}

async function select(g) {
  try {
    detail.value = await getGroup(g._id)
    tab.value = 'members'
    settingDesc.value = detail.value?.description || ''
    const [b, q, lb] = await Promise.all([
      getBanks({ limit: 50 }).catch(() => ({ data: [] })),
      getQuestions({ limit: 50 }).catch(() => ({ data: [] })),
      getLeaderboard({ type: 'total', period: 'all' }).catch(() => []),
    ])
    banks.value = b.data || []
    questions.value = q.data || []
    board.value = lb?.items || lb || []
  } catch (e) {
    toast(e?.response?.data?.message || e.message || '加载详情失败', 'error')
  }
}

async function remove(g) {
  if (!confirm(`删除群组「${g.name}」？`)) return
  try {
    await deleteGroup(g._id)
    toast('已删除', 'success')
    if (detail.value?._id === g._id) detail.value = null
    await load()
  } catch (e) {
    toast(e?.message || '删除失败', 'error')
  }
}

async function kick(m) {
  const mid = m._id || m.userId || m.user?._id
  if (!detail.value?._id || !mid) return
  try {
    await removeMemberFromGroup(detail.value._id, mid)
    toast('已移除', 'success')
    detail.value = await getGroup(detail.value._id)
  } catch (e) {
    toast(e?.message || '移除失败', 'error')
  }
}

async function toggleBank(id, checked) {
  const ids = new Set(detail.value.bankIds || [])
  if (checked) ids.add(id)
  else ids.delete(id)
  await persistDetail({ bankIds: [...ids] })
  toast('已更新关联题库', 'success')
}

async function postRoom() {
  if (!roomText.value.trim()) return
  const studyRoom = [
    ...(detail.value.studyRoom || []),
    {
      _id: `room-${Date.now()}`,
      userName: auth.user?.name || '我',
      content: roomText.value.trim(),
      createdAt: new Date().toISOString(),
    },
  ]
  roomText.value = ''
  await persistDetail({ studyRoom })
}

async function addAssignment() {
  if (!asgTitle.value.trim()) return
  const assignments = [
    ...(detail.value.assignments || []),
    { _id: `asg-${Date.now()}`, title: asgTitle.value.trim(), dueAt: new Date().toISOString() },
  ]
  asgTitle.value = ''
  await persistDetail({ assignments })
  toast('已布置作业', 'success')
}

async function saveSettings() {
  await persistDetail({ description: settingDesc.value })
  toast('设置已保存', 'success')
  await load()
}

onMounted(load)
</script>
