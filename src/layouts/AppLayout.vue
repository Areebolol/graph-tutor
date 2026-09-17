<template>
  <div class="flex min-h-screen" style="background-color: transparent">
    <button
      type="button"
      class="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg border shadow-sm"
      style="background-color: var(--color-bg-primary); border-color: var(--color-border)"
      aria-label="打开菜单"
      @click="mobileOpen = !mobileOpen"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <div
      v-if="mobileOpen"
      class="fixed inset-0 bg-black/50 z-40 md:hidden"
      @click="mobileOpen = false"
    />

    <aside
      class="group fixed left-0 top-0 z-50 h-full flex flex-col border-r transition-[width,transform] duration-300 ease-out"
      style="background-color: var(--color-bg-primary); border-color: var(--color-border); color: var(--color-text-primary)"
      :class="[
        wide ? 'w-64' : 'w-[4.5rem]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ]"
      @mouseenter="expand = true"
      @mouseleave="expand = false"
    >
      <div class="shrink-0 px-3 py-4 border-b" style="border-color: var(--color-border)">
        <div class="flex items-center" :class="wide ? 'gap-3' : 'justify-center'">
          <div
            class="w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-bold shrink-0"
            style="border-color: var(--color-border); background-color: var(--color-bg-secondary); color: var(--color-primary-deep)"
          >
            GT
          </div>
          <div v-if="wide" class="min-w-0">
            <span class="block text-base font-bold tracking-tight truncate">GraphTutor</span>
            <span class="block text-[11px] truncate" style="color: var(--color-text-tertiary)">知识图谱学习</span>
          </div>
        </div>

        <div v-if="auth.user" class="flex items-center mt-3" :class="wide ? 'gap-3' : 'justify-center'">
          <div class="relative shrink-0">
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              style="background-color: var(--color-primary-deep)"
            >
              {{ avatarLetter }}
            </div>
            <span
              class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"
              aria-hidden="true"
            />
          </div>
          <div v-if="wide" class="flex-1 min-w-0">
            <div class="text-sm font-semibold truncate">{{ auth.user.name || auth.user.email?.split('@')[0] }}</div>
            <div class="text-xs truncate" style="color: var(--color-text-tertiary)">{{ roleLabel }}</div>
          </div>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto py-3 px-2 min-h-0" style="max-height: calc(100vh - 220px)">
        <div v-for="group in menuGroups" :key="group.label" class="mb-2">
          <button
            type="button"
            class="w-full flex items-center rounded-lg px-3 py-2 transition-colors duration-150 hover:bg-[var(--color-bg-secondary)]"
            :class="wide ? 'justify-between text-left' : 'justify-center'"
            style="color: var(--color-text-tertiary)"
            @click="toggleGroup(group.label)"
          >
            <template v-if="wide">
              <span class="text-xs font-semibold uppercase tracking-wider">{{ group.label }}</span>
              <span class="text-[10px]">{{ expandedGroups.has(group.label) ? '▾' : '▸' }}</span>
            </template>
            <span
              v-else
              class="text-[10px] font-semibold tracking-wider truncate max-w-full"
              :title="group.label"
            >
              {{ group.label.slice(0, 2) }}
            </span>
          </button>

          <div
            v-if="wide && expandedGroups.has(group.label)"
            class="mt-0.5 ml-1 pl-3 space-y-0.5"
            style="border-left: 1px solid var(--color-border)"
          >
            <RouterLink
              v-for="item in group.children"
              :key="item.to"
              :to="item.to"
              class="relative flex items-center rounded-lg px-3 py-2 text-sm text-left transition-colors duration-150 hover:bg-[var(--color-bg-secondary)]"
              :style="itemActiveStyle(item.to)"
              @click="mobileOpen = false"
            >
              <span class="flex-1 truncate">{{ item.title }}</span>
              <span
                v-if="isActive(item.to)"
                class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                style="background-color: var(--color-primary-deep)"
                aria-hidden="true"
              />
            </RouterLink>
          </div>
        </div>
      </nav>

      <div
        v-if="auth.user"
        class="shrink-0 p-2 border-t space-y-1.5"
        style="border-color: var(--color-border)"
      >
        <button
          type="button"
          class="w-full rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:opacity-80"
          :class="wide ? 'text-left' : 'flex justify-center'"
          style="color: var(--color-text-secondary)"
          @click="router.push('/profile'); mobileOpen = false"
        >
          {{ wide ? '个人设置' : '⚙️' }}
        </button>
        <button
          type="button"
          class="w-full rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          :class="wide ? 'text-left' : 'flex justify-center'"
          :disabled="loggingOut"
          @click="onLogout"
        >
          {{ wide ? (loggingOut ? '退出中…' : '退出登录') : '🚪' }}
        </button>
      </div>
      <div v-else class="shrink-0 p-2 border-t" style="border-color: var(--color-border)">
        <RouterLink to="/login" class="btn btn-primary w-full" @click="mobileOpen = false">登录</RouterLink>
      </div>
    </aside>

    <main
      class="flex-1 min-w-0 max-w-full transition-[margin] duration-300 ease-out px-3 sm:px-4 lg:px-6 xl:px-8 pb-6 sm:pb-8 pt-14 md:pt-2 lg:pt-3"
      :class="expand ? 'md:ml-64' : 'md:ml-[4.5rem]'"
    >
      <div class="page-shell">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { canManageResources, getRoleName, isAdmin } from '../utils/role'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const expand = ref(false)
const mobileOpen = ref(false)
const wide = computed(() => expand.value || mobileOpen.value)
const loggingOut = ref(false)
const expandedGroups = ref(new Set(['学习', '社交']))

const avatarLetter = computed(() =>
  (auth.user?.name || auth.user?.email || '?').charAt(0).toUpperCase(),
)
const roleLabel = computed(() => getRoleName(auth.user?.role))

const menuGroups = computed(() => {
  const groups = [
    {
      label: '学习',
      children: [
        { to: '/home', title: '首页' },
        { to: '/quiz', title: '练习' },
        { to: '/exam', title: '考试' },
        { to: '/review', title: '错题复习' },
        { to: '/graph', title: '知识图谱' },
        { to: '/learning-path', title: '学习路径' },
        { to: '/analytics', title: '学习数据' },
      ],
    },
    {
      label: '工具',
      children: [
        { to: '/notes', title: '学习笔记' },
        { to: '/favorites', title: '我的收藏' },
        { to: '/study-plans', title: '学习计划' },
        { to: '/check-in', title: '每日打卡' },
        { to: '/notifications', title: '通知' },
      ],
    },
    {
      label: '社交',
      children: [
        { to: '/messages', title: '消息' },
        { to: '/friends', title: '好友' },
        { to: '/groups', title: '群组' },
        { to: '/community', title: '社区' },
        { to: '/learning-posts', title: '学习动态' },
        { to: '/friends/discover', title: '发现好友' },
        { to: '/friend-challenges', title: '好友挑战' },
      ],
    },
    {
      label: '更多',
      children: [
        { to: '/review-plans', title: '复习计划' },
        { to: '/leaderboard', title: '排行榜' },
        { to: '/mentor', title: '师徒' },
        { to: '/skill-tree', title: '技能树' },
        { to: '/goals', title: '学习目标' },
        { to: '/achievements', title: '学习成就' },
        { to: '/shop', title: '成就商城' },
        { to: '/recommendations', title: '智能推荐' },
      ],
    },
  ]

  if (canManageResources(auth.user)) {
    groups.push({
      label: '内容管理',
      children: [
        { to: '/banks', title: '题库管理' },
        { to: '/banks/import', title: '题库导入' },
        { to: '/questions', title: '题目管理' },
        { to: '/ai', title: 'AI 出题' },
        { to: '/nodes', title: '知识点管理' },
        { to: '/subjects', title: '学科管理' },
      ],
    })
  }

  if (isAdmin(auth.user)) {
    groups.push({
      label: '系统管理',
      children: [
        { to: '/admin', title: '后台管理' },
        { to: '/admin/users', title: '用户管理' },
        { to: '/admin/operation-logs', title: '操作日志' },
        { to: '/admin/reports', title: '统计报表' },
        { to: '/admin/role-applications', title: '角色申请' },
      ],
    })
  }

  groups.push({
    label: '个人',
    children: [
      { to: '/profile', title: '个人资料' },
      ...(auth.user?.role === 'admin' ? [] : [{ to: '/role/apply', title: '角色申请' }]),
      { to: '/settings', title: '系统设置' },
    ],
  })

  return groups
})

function isActive(to) {
  return route.path === to
}

function itemActiveStyle(to) {
  if (isActive(to)) {
    return {
      backgroundColor: 'var(--color-primary-light)',
      color: 'var(--color-primary-deep)',
      fontWeight: 600,
    }
  }
  return { color: 'var(--color-text-secondary)' }
}

function toggleGroup(label) {
  const next = new Set(expandedGroups.value)
  if (next.has(label)) next.delete(label)
  else next.add(label)
  expandedGroups.value = next
}

async function onLogout() {
  loggingOut.value = true
  try {
    await auth.logout()
    router.push('/login')
  } finally {
    loggingOut.value = false
    mobileOpen.value = false
  }
}
</script>
