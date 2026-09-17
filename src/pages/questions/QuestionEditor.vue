<template>
  <div class="space-y-4 animate-rise-in max-w-2xl">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">{{ isEdit ? '编辑题目' : '新建题目' }}</h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary)">支持单选 / 判断 / 多选 / 填空 / 简答</p>
    </div>

    <div v-if="err" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{{ err }}</div>

    <form class="surface space-y-4" @submit.prevent="save">
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="label">题型</label>
          <select v-model="form.type" class="input" :disabled="isEdit">
            <option value="single">单选</option>
            <option value="judge">判断</option>
            <option value="multiple">多选</option>
            <option value="fill">填空</option>
            <option value="short">简答</option>
          </select>
        </div>
        <div>
          <label class="label">难度 (1-5)</label>
          <select v-model.number="form.difficulty" class="input">
            <option v-for="d in 5" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
        <div>
          <label class="label">学科 *</label>
          <select v-model="form.subjectCode" class="input" required>
            <option value="" disabled>请选择</option>
            <option v-for="s in flatSubjects" :key="s.code" :value="s.code">{{ s.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">所属题库</label>
          <select v-model="form.bankId" class="input">
            <option value="">无</option>
            <option v-for="b in banks" :key="b._id" :value="b._id">{{ b.name }}</option>
          </select>
        </div>
      </div>

      <div>
        <label class="label">题干 *（至少 5 字）</label>
        <textarea v-model="form.content" class="input min-h-[100px]" rows="4" required />
      </div>

      <!-- 选项类 -->
      <div v-if="isChoiceType" class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-sm">选项</h2>
          <button v-if="form.type !== 'judge'" type="button" class="btn btn-ghost text-xs" @click="addOption">
            + 选项
          </button>
        </div>
        <div v-for="(opt, i) in form.options" :key="i" class="flex gap-2 items-center">
          <span class="w-6 text-sm font-semibold">{{ String.fromCharCode(65 + i) }}</span>
          <input v-model="form.options[i]" class="input flex-1" :placeholder="`选项 ${String.fromCharCode(65 + i)}`" />
          <template v-if="form.type === 'multiple'">
            <input v-model="multiAnswers" type="checkbox" :value="i" class="h-4 w-4" />
          </template>
          <template v-else>
            <input v-model.number="form.answerIndex" type="radio" :value="i" name="answer" class="h-4 w-4" />
          </template>
          <button
            v-if="form.type !== 'judge' && form.options.length > 2"
            type="button"
            class="btn btn-ghost text-xs text-red-600"
            @click="removeOption(i)"
          >
            删
          </button>
        </div>
        <p class="text-xs" style="color: var(--color-text-tertiary)">
          {{ form.type === 'multiple' ? '勾选所有正确答案' : '点选唯一正确答案' }}
        </p>
      </div>

      <!-- 填空 -->
      <div v-else-if="form.type === 'fill'" class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-sm">空白答案</h2>
          <button type="button" class="btn btn-ghost text-xs" @click="form.blankAnswers.push('')">+ 空白</button>
        </div>
        <div v-for="(_, i) in form.blankAnswers" :key="i" class="flex gap-2">
          <input v-model="form.blankAnswers[i]" class="input flex-1" :placeholder="`空白 ${i + 1}`" />
          <button
            v-if="form.blankAnswers.length > 1"
            type="button"
            class="btn btn-ghost text-xs text-red-600"
            @click="form.blankAnswers.splice(i, 1)"
          >
            删
          </button>
        </div>
      </div>

      <!-- 简答 -->
      <div v-else>
        <label class="label">参考答案 *</label>
        <textarea v-model="form.shortAnswer" class="input min-h-[80px]" rows="3" />
      </div>

      <div>
        <label class="label">解析</label>
        <textarea v-model="form.explain" class="input min-h-[80px]" rows="2" />
      </div>

      <div>
        <label class="label">标签（逗号分隔）</label>
        <input v-model="tagsText" class="input" placeholder="操作系统, 进程" />
      </div>

      <div class="flex gap-2">
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? '保存中…' : '保存' }}
        </button>
        <RouterLink to="/questions" class="btn btn-ghost">取消</RouterLink>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBanks } from '../../api/v3/questionBanks'
import { createQuestion, getQuestion, updateQuestion } from '../../api/v3/questions'
import { getSubjectTree } from '../../api/v3/subjects'
import { flattenSubjects } from '../../utils/practiceSubmit'
import toast from '../../utils/toast'

const route = useRoute()
const router = useRouter()
const questionId = computed(() => route.params.id)
const isEdit = computed(() => Boolean(questionId.value))

const subjects = ref([])
const banks = ref([])
const flatSubjects = computed(() => flattenSubjects(subjects.value))
const saving = ref(false)
const err = ref('')
const tagsText = ref('')
const multiAnswers = ref([])

const form = reactive({
  type: 'single',
  content: '',
  difficulty: 3,
  subjectCode: '',
  bankId: '',
  options: ['', '', '', ''],
  answerIndex: 0,
  blankAnswers: [''],
  shortAnswer: '',
  explain: '',
})

const isChoiceType = computed(() => ['single', 'judge', 'multiple'].includes(form.type))

watch(
  () => form.type,
  (t) => {
    if (t === 'judge') {
      form.options = ['正确', '错误']
      form.answerIndex = 0
    } else if (t === 'single' && form.options.length < 2) {
      form.options = ['', '', '', '']
    } else if (t === 'fill' && !form.blankAnswers.length) {
      form.blankAnswers = ['']
    }
  },
)

function addOption() {
  form.options.push('')
}

function removeOption(i) {
  form.options.splice(i, 1)
  if (form.answerIndex >= form.options.length) form.answerIndex = 0
  multiAnswers.value = multiAnswers.value.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x))
}

function buildPayload() {
  const content = form.content.trim()
  if (content.length < 5) throw new Error('题干至少 5 个字符')
  if (!form.subjectCode) throw new Error('请选择学科')

  const payload = {
    type: form.type,
    content,
    difficulty: form.difficulty,
    subjectCode: form.subjectCode,
    bankId: form.bankId || undefined,
    explain: form.explain.trim(),
    tags: tagsText.value
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean),
  }

  if (form.type === 'single' || form.type === 'judge') {
    const options = form.options.map((o) => String(o).trim()).filter(Boolean)
    if (options.length < 2) throw new Error('至少需要 2 个选项')
    if (typeof form.answerIndex !== 'number' || form.answerIndex < 0 || form.answerIndex >= options.length) {
      throw new Error('请选择正确答案')
    }
    payload.options = options
    payload.answerIndex = form.answerIndex
    payload.answer = form.answerIndex
  } else if (form.type === 'multiple') {
    const options = form.options.map((o) => String(o).trim()).filter(Boolean)
    if (options.length < 2) throw new Error('至少需要 2 个选项')
    const ans = [...multiAnswers.value].sort((a, b) => a - b)
    if (!ans.length) throw new Error('请至少勾选一个正确答案')
    payload.options = options
    payload.answer = ans
    payload.answerIndices = ans
  } else if (form.type === 'fill') {
    const blanks = form.blankAnswers.map((b) => String(b).trim()).filter(Boolean)
    if (!blanks.length) throw new Error('请填写空白答案')
    payload.blankAnswers = blanks
    payload.blanks = blanks.length
    payload.answer = blanks
  } else if (form.type === 'short') {
    if (!form.shortAnswer.trim()) throw new Error('请填写参考答案')
    payload.answer = form.shortAnswer.trim()
  }

  return payload
}

async function save() {
  err.value = ''
  saving.value = true
  try {
    const payload = buildPayload()
    if (isEdit.value) {
      await updateQuestion(questionId.value, payload)
      toast('题目已更新', 'success')
      router.replace(`/questions/${questionId.value}/detail`)
    } else {
      const created = await createQuestion(payload)
      toast('题目已创建', 'success')
      router.replace(`/questions/${created._id}/detail`)
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
  try {
    banks.value = (await getBanks({ limit: 100 })).data || []
  } catch {
    banks.value = []
  }

  const qBank = route.query.bankId
  if (typeof qBank === 'string' && qBank) form.bankId = qBank

  if (isEdit.value) {
    try {
      const q = await getQuestion(questionId.value)
      form.type = q.type || 'single'
      form.content = q.content || ''
      form.difficulty = q.difficulty || 3
      form.subjectCode =
        typeof q.subjectCode === 'object' ? q.subjectCode?.code || '' : q.subjectCode || ''
      form.bankId = typeof q.bankId === 'object' ? q.bankId?._id || '' : q.bankId || ''
      form.explain = q.explain || ''
      tagsText.value = Array.isArray(q.tags) ? q.tags.join(', ') : ''
      form.options = Array.isArray(q.options) && q.options.length ? [...q.options] : ['', '', '', '']
      form.answerIndex = typeof q.answerIndex === 'number' ? q.answerIndex : typeof q.answer === 'number' ? q.answer : 0
      if (q.type === 'multiple') {
        multiAnswers.value = Array.isArray(q.answer)
          ? [...q.answer]
          : Array.isArray(q.answerIndices)
            ? [...q.answerIndices]
            : []
      }
      if (q.type === 'fill') {
        form.blankAnswers = Array.isArray(q.blankAnswers)
          ? [...q.blankAnswers]
          : Array.isArray(q.answer)
            ? [...q.answer]
            : ['']
      }
      if (q.type === 'short') form.shortAnswer = typeof q.answer === 'string' ? q.answer : ''
      if (q.type === 'judge') form.options = q.options?.length >= 2 ? [...q.options] : ['正确', '错误']
    } catch (e) {
      err.value = e?.message || '加载题目失败'
    }
  }
})
</script>
