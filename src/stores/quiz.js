import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 练习/考试交卷后的结果载荷，供 /result 读取 */
export const useQuizResultStore = defineStore('quizResult', () => {
  const payload = ref(null)

  function setResult({ stats, questions, answers, source = 'quiz' }) {
    payload.value = { stats, questions, answers, source, ts: Date.now() }
  }

  function clear() {
    payload.value = null
  }

  return { payload, setResult, clear }
})

/** Review → Quiz 固定题号开练 */
export const usePracticeLaunchStore = defineStore('practiceLaunch', () => {
  const questionIds = ref(null)
  const source = ref(null)

  function launch(ids, practiceSource = 'review') {
    questionIds.value = Array.isArray(ids) ? ids.map(String) : null
    source.value = practiceSource
  }

  function consume() {
    const ids = questionIds.value
    const practiceSource = source.value
    questionIds.value = null
    source.value = null
    return { questionIds: ids, source: practiceSource }
  }

  return { questionIds, source, launch, consume }
})
