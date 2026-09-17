<template>
  <div class="animate-rise-in" style="color: var(--color-text-primary)">
    <header class="pt-2 sm:pt-4">
      <p class="text-3xl sm:text-4xl font-bold tracking-tight" style="color: var(--color-text-primary)">
        GraphTutor
      </p>
      <p class="mt-2 text-base sm:text-lg" style="color: var(--color-text-secondary)">
        {{ greeting }}
      </p>
      <p class="mt-1 text-sm" style="color: var(--color-text-tertiary)">
        从练习开始，错题与复习会自动跟上。
      </p>
    </header>

    <section
      v-if="!auth.user"
      class="rounded-xl text-white p-6 sm:p-8"
      style="background-color: var(--color-cta)"
    >
      <h2 class="text-xl font-bold mb-1">登录后开始学习</h2>
      <p class="text-white/75 text-sm mb-5 max-w-md">
        练习、错题本、学习数据和好友功能需要登录后使用。
      </p>
      <div class="flex flex-wrap gap-2">
        <RouterLink to="/login" class="btn btn-primary border-0">去登录</RouterLink>
        <RouterLink
          to="/register"
          class="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-white/35 text-white/90 hover:bg-white/10 text-sm font-semibold"
        >
          注册账号
        </RouterLink>
      </div>
    </section>

    <section
      v-else
      class="rounded-xl text-white p-6 sm:p-7"
      style="background-color: var(--color-cta)"
    >
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div class="min-w-0">
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight mb-1">立即开始练习</h2>
          <p class="text-white/75 text-sm">选择题库即可做题；错题会进入错题本，方便复习</p>
        </div>
        <div class="flex flex-wrap gap-2 shrink-0">
          <RouterLink to="/quiz" class="btn btn-primary gap-2 px-5 py-2.5">开始练习</RouterLink>
          <RouterLink
            to="/recommendations"
            class="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-white/35 text-white/90 hover:bg-white/10 text-sm font-medium"
          >
            智能推荐
          </RouterLink>
          <RouterLink
            to="/review"
            class="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-white/35 text-white/90 hover:bg-white/10 text-sm font-medium"
          >
            错题复习
          </RouterLink>
        </div>
      </div>
    </section>

    <section v-if="auth.user" class="surface">
      <h2 class="section-title mb-4">今日建议</h2>
      <div v-if="suggestLoading" class="text-sm py-2" style="color: var(--color-text-tertiary)">加载中…</div>
      <div
        v-else-if="!forgettingCurve.length && !guessYouWant.length"
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <p class="text-sm" style="color: var(--color-text-secondary)">
          暂无个性化建议，先去练几道题，系统会根据错题给你推荐。
        </p>
        <div class="flex flex-wrap gap-2 shrink-0">
          <RouterLink to="/quiz" class="btn btn-primary">开始练习</RouterLink>
          <RouterLink to="/recommendations" class="btn btn-outline">智能推荐</RouterLink>
        </div>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div v-if="forgettingCurve.length">
          <div class="text-sm font-medium mb-2" style="color: var(--color-text-secondary)">建议复习</div>
          <ul class="space-y-2.5">
            <li
              v-for="item in forgettingCurve.slice(0, 3)"
              :key="item.knowledgeNodeId || item._id"
              class="flex items-center gap-2 text-sm"
            >
              <span class="truncate flex-1">{{ item.knowledgeNodeId || item.name || '知识点' }}</span>
              <RouterLink to="/review" class="text-xs text-blue-600 hover:underline shrink-0">去复习</RouterLink>
            </li>
          </ul>
        </div>
        <div v-if="guessYouWant.length">
          <div class="text-sm font-medium mb-2" style="color: var(--color-text-secondary)">猜你想练</div>
          <ul class="space-y-2.5">
            <li v-for="q in guessYouWant.slice(0, 3)" :key="q._id || q.id">
              <RouterLink
                :to="`/questions/${q._id || q.id}`"
                class="text-sm hover:text-blue-600 line-clamp-1"
              >
                {{ questionPreview(q) }}
              </RouterLink>
            </li>
          </ul>
          <RouterLink to="/recommendations" class="inline-block mt-2 text-xs text-blue-600 hover:underline">
            更多推荐 →
          </RouterLink>
        </div>
      </div>
    </section>

    <section v-if="auth.user" class="surface">
      <h3 class="section-title mb-4">快速入口</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RouterLink
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
          class="flex flex-col items-start gap-2 rounded-xl px-3.5 py-3.5 transition-colors border border-transparent hover:border-blue-200"
          style="background-color: var(--color-bg-secondary)"
        >
          <span
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold"
            style="background-color: var(--color-bg-primary); border-color: var(--color-border); color: var(--color-primary-deep)"
          >
            {{ action.mark }}
          </span>
          <span class="text-sm font-semibold">{{ action.title }}</span>
          <span class="text-xs" style="color: var(--color-text-tertiary)">{{ action.desc }}</span>
        </RouterLink>
      </div>
    </section>

    <section v-if="auth.user" class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <RouterLink to="/review" class="surface !p-4 hover:opacity-95">
        <div class="text-3xl font-bold tracking-tight tabular-nums">{{ overview.reviewCount ?? '—' }}</div>
        <div class="mt-1 text-sm font-medium" style="color: var(--color-text-secondary)">今日需要复习</div>
        <div class="mt-2 text-xs" style="color: var(--color-text-tertiary)">点击开始复习 →</div>
      </RouterLink>
      <RouterLink to="/analytics" class="surface !p-4 hover:opacity-95">
        <div class="text-3xl font-bold tracking-tight tabular-nums">
          {{ overview.efficiency ?? '—' }}
          <span v-if="overview.efficiency != null" class="text-sm font-medium" style="color: var(--color-text-tertiary)">分</span>
        </div>
        <div class="mt-1 text-sm font-medium" style="color: var(--color-text-secondary)">学习效率评分</div>
        <div class="mt-2 text-xs" style="color: var(--color-text-tertiary)">查看详细分析 →</div>
      </RouterLink>
      <RouterLink to="/friends" class="surface !p-4 hover:opacity-95">
        <div class="text-3xl font-bold tracking-tight tabular-nums">{{ overview.friendsCount ?? '—' }}</div>
        <div class="mt-1 text-sm font-medium" style="color: var(--color-text-secondary)">好友</div>
        <div class="mt-2 text-xs" style="color: var(--color-text-tertiary)">查看好友列表 →</div>
      </RouterLink>
    </section>

    <section class="surface">
      <div class="flex items-center justify-between mb-3">
        <h2 class="section-title">最近通知</h2>
        <RouterLink to="/notifications" class="text-sm text-blue-600 hover:underline">全部</RouterLink>
      </div>
      <p v-if="notifLoading" class="text-sm py-4" style="color: var(--color-text-tertiary)">加载中…</p>
      <ul v-else-if="notifications.length" class="divide-y" style="border-color: var(--color-border)">
        <li
          v-for="n in notifications.slice(0, 3)"
          :key="n._id || n.id"
          class="py-3 first:pt-0 last:pb-0 border-t first:border-t-0"
          style="border-color: var(--color-border)"
        >
          <div class="font-medium text-sm">{{ n.title || '通知' }}</div>
          <p class="text-sm line-clamp-1" style="color: var(--color-text-secondary)">
            {{ n.content || n.message || '暂无内容' }}
          </p>
          <p class="text-xs mt-0.5" style="color: var(--color-text-tertiary)">{{ formatTimeAgo(n.createdAt) }}</p>
        </li>
      </ul>
      <p v-else class="text-sm py-4" style="color: var(--color-text-tertiary)">暂无通知</p>
    </section>

    <section
      v-if="auth.user"
      class="flex flex-wrap gap-x-4 gap-y-2 text-sm pb-2"
      style="color: var(--color-text-tertiary)"
    >
      <RouterLink to="/friends" class="hover:text-blue-600 transition-colors">
        好友{{ overview.friendsCount > 0 ? `（${overview.friendsCount}）` : '' }}
      </RouterLink>
      <span>·</span>
      <RouterLink to="/recommendations" class="hover:text-blue-600 transition-colors">智能推荐</RouterLink>
      <span>·</span>
      <RouterLink to="/analytics" class="hover:text-blue-600 transition-colors">学习数据</RouterLink>
      <span>·</span>
      <RouterLink to="/community" class="hover:text-blue-600 transition-colors">社区</RouterLink>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getFriends } from '../api/v3/friends'
import { getNotifications } from '../api/v3/notifications'
import { getRecommendedQuestions } from '../api/v3/recommendations'
import { useAuthStore } from '../stores/auth'
import api from '../api/api'

const auth = useAuthStore()

const notifications = ref([])
const guessYouWant = ref([])
const forgettingCurve = ref([])
const notifLoading = ref(false)
const suggestLoading = ref(false)
const overview = reactive({
  reviewCount: null,
  efficiency: null,
  friendsCount: null,
})

const quickActions = [
  { to: '/quiz', title: '开始练习', desc: '选择题库做题', mark: '练' },
  { to: '/review', title: '错题复习', desc: '巩固薄弱点', mark: '错' },
  { to: '/learning-path', title: '学习路径', desc: '按掌握度推进', mark: '径' },
  { to: '/shop', title: '成就商城', desc: '积分兑换道具', mark: '商' },
]

const greeting = computed(() => {
  if (auth.user?.name) return `你好，${auth.user.name}`
  if (auth.user?.email) return `你好，${auth.user.email.split('@')[0]}`
  return '知识图谱驱动的智能学习'
})

function formatTimeAgo(dateString) {
  if (!dateString) return '刚刚'
  const date = new Date(dateString)
  const diff = Date.now() - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

function questionPreview(q) {
  const raw = ((q.content || q.title || '').replace(/<[^>]+>/g, '').trim() || '题目')
  return raw.length > 36 ? `${raw.slice(0, 36)}…` : raw
}

function normalizeList(data) {
  return data?.items || data?.notifications || (Array.isArray(data) ? data : [])
}

async function loadHome() {
  if (!auth.user) {
    notifications.value = []
    guessYouWant.value = []
    forgettingCurve.value = []
    return
  }

  notifLoading.value = true
  suggestLoading.value = true
  try {
    const [notifRes, guessRes, forgetRes, friendsRes, analysisRes] = await Promise.allSettled([
      getNotifications({ page: 1, limit: 5 }),
      getRecommendedQuestions({ strategy: 'weak_points', limit: 5, includeReasons: false }),
      api.get('/v3/enhanced-analytics/forgetting-curve', { params: { days: 15 } }),
      getFriends({ limit: 50 }),
      api.get('/v3/enhanced-analytics/comprehensive', { params: { days: 7 } }),
    ])

    if (notifRes.status === 'fulfilled') {
      notifications.value = normalizeList(notifRes.value).slice(0, 5)
    }

    if (guessRes.status === 'fulfilled') {
      const g = guessRes.value
      guessYouWant.value = Array.isArray(g) ? g : g?.items || g?.data || []
    }

    if (forgetRes.status === 'fulfilled') {
      const d = forgetRes.value?.data?.data || forgetRes.value?.data || []
      forgettingCurve.value = Array.isArray(d) ? d : d?.items || []
    }

    if (friendsRes.status === 'fulfilled') {
      const fr = friendsRes.value
      const list = Array.isArray(fr) ? fr : fr?.friends || fr?.items || []
      overview.friendsCount = list.length
    }

    if (analysisRes.status === 'fulfilled') {
      const a = analysisRes.value?.data?.data || analysisRes.value?.data || {}
      overview.efficiency = a?.efficiency?.score ?? null
      overview.reviewCount = a?.review?.todayCount ?? a?.todayReviewCount ?? null
    }
  } finally {
    notifLoading.value = false
    suggestLoading.value = false
  }
}

watch(
  () => auth.user?._id || auth.user?.id,
  () => loadHome(),
)

onMounted(loadHome)
</script>
