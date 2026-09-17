<template>
  <div class="space-y-4 animate-rise-in max-w-xl">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">每日打卡</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">记录今日学习时长与题量</p>
    </div>

    <form class="surface space-y-4" @submit.prevent="submit">
      <div>
        <label class="label">学习计划 *</label>
        <select v-model="planId" class="input" required>
          <option value="" disabled>请选择</option>
          <option v-for="p in plans" :key="p._id" :value="p._id">{{ p.name }}</option>
        </select>
      </div>
      <div>
        <label class="label">日期</label>
        <input v-model="form.date" type="date" class="input" required />
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div>
          <label class="label">时长(分)</label>
          <input v-model.number="form.studyDuration" type="number" min="0" class="input" />
        </div>
        <div>
          <label class="label">完成题数</label>
          <input v-model.number="form.completedQuestions" type="number" min="0" class="input" />
        </div>
        <div>
          <label class="label">正确题数</label>
          <input v-model.number="form.correctQuestions" type="number" min="0" class="input" />
        </div>
      </div>
      <div>
        <label class="label">心情</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="m in moods"
            :key="m.value"
            type="button"
            class="btn text-sm"
            :class="form.mood === m.value ? 'btn-primary' : 'btn-outline'"
            @click="form.mood = m.value"
          >
            {{ m.label }}
          </button>
        </div>
      </div>
      <div>
        <label class="label">小结</label>
        <textarea v-model="form.summary" class="input" rows="3" placeholder="今天学了什么…" />
      </div>
      <div v-if="err" class="text-sm text-red-600">{{ err }}</div>
      <button type="submit" class="btn btn-primary" :disabled="submitting || !planId">
        {{ submitting ? '提交中…' : '打卡' }}
      </button>
    </form>

    <div class="surface space-y-2">
      <h2 class="font-semibold">最近打卡</h2>
      <div v-for="c in history" :key="c._id || c.date" class="text-sm flex justify-between gap-2 border-b py-2" style="border-color: var(--color-border)">
        <span>{{ (c.date || '').toString().slice(0, 10) }} · {{ c.completedQuestions || 0 }} 题 · {{ c.studyDuration || 0 }} 分</span>
        <span style="color: var(--color-text-tertiary)">{{ c.mood || '' }}</span>
      </div>
      <p v-if="!history.length" class="text-sm" style="color: var(--color-text-tertiary)">暂无记录</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { checkIn, getAllCheckIns, getStudyPlans } from '../api/v3/studyPlans'
import toast from '../utils/toast'

const route = useRoute()
const plans = ref([])
const planId = ref('')
const history = ref([])
const submitting = ref(false)
const err = ref('')

const moods = [
  { value: 'great', label: '很好' },
  { value: 'good', label: '不错' },
  { value: 'normal', label: '一般' },
  { value: 'tired', label: '疲惫' },
]

const form = reactive({
  date: new Date().toISOString().slice(0, 10),
  studyDuration: 30,
  completedQuestions: 0,
  correctQuestions: 0,
  mood: 'normal',
  summary: '',
})

async function loadPlans() {
  try {
    const res = await getStudyPlans({ limit: 50, status: 'active' })
    const data = res?.data || res
    plans.value = data?.items || data?.plans || (Array.isArray(data) ? data : [])
    const q = route.query.planId
    if (typeof q === 'string' && q) planId.value = q
    else if (plans.value[0]) planId.value = plans.value[0]._id
  } catch {
    plans.value = []
  }
}

async function loadHistory() {
  try {
    const res = await getAllCheckIns({ limit: 10 })
    const data = res?.data || res
    history.value = data?.items || data?.checkIns || (Array.isArray(data) ? data : [])
  } catch {
    history.value = []
  }
}

async function submit() {
  err.value = ''
  if (!planId.value) {
    err.value = '请选择学习计划'
    return
  }
  if (form.correctQuestions > form.completedQuestions) {
    err.value = '正确题数不能大于完成题数'
    return
  }
  submitting.value = true
  try {
    await checkIn(planId.value, { ...form })
    toast('打卡成功', 'success')
    form.summary = ''
    await loadHistory()
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || '打卡失败'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await loadPlans()
  await loadHistory()
})
</script>
