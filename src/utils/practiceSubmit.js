import { batchCheckAnswers } from '../utils/questionScoring'
import { batchSubmitRecords } from '../api/records'

export function qidOf(q, index = 0) {
  return q?._id || q?.id || index
}

export function buildRecordsPayload(questions, answers, mode = 'quiz') {
  const result = batchCheckAnswers(questions, answers)
  const records = []

  questions.forEach((q, index) => {
    const qid = qidOf(q, index)
    const questionId = q._id
      ? typeof q._id === 'string'
        ? q._id
        : String(q._id)
      : q.id || String(index)
    const userAnswer = answers[qid]
    const detail = result.details[index]

    let answerData = {}
    if (q.type === 'multiple') {
      answerData = {
        answerIndex: Array.isArray(userAnswer) ? userAnswer : null,
        correctIndex: Array.isArray(q.answer)
          ? q.answer
          : Array.isArray(q.answerIndices)
            ? q.answerIndices
            : null,
      }
    } else if (q.type === 'fill') {
      answerData = {
        answerIndex: Array.isArray(userAnswer) ? userAnswer : null,
        correctIndex: Array.isArray(q.blankAnswers)
          ? q.blankAnswers
          : Array.isArray(q.answer)
            ? q.answer
            : null,
      }
    } else if (q.type === 'short' || q.type === 'coding') {
      answerData = {
        answerIndex: typeof userAnswer === 'string' ? userAnswer : null,
        correctIndex: typeof q.answer === 'string' ? q.answer : null,
      }
    } else {
      answerData = {
        answerIndex: typeof userAnswer === 'number' ? userAnswer : null,
        correctIndex:
          typeof (q.answerIndex ?? q.answer) === 'number' ? (q.answerIndex ?? q.answer) : null,
      }
    }

    records.push({
      questionId: String(questionId),
      knowledgeNodeId: q.knowledgeNodeId || null,
      ...answerData,
      isCorrect: Boolean(detail.isCorrect),
      score: typeof detail.score === 'number' ? detail.score : detail.isCorrect ? 1 : 0,
      mode,
    })
  })

  return { result, records: records.filter((r) => r.questionId) }
}

export async function submitPracticeRecords(user, questions, answers, mode = 'quiz') {
  if (!user || !questions?.length) return null
  const userId = user._id || user.id || user.userId
  if (!userId) return null

  const { result, records } = buildRecordsPayload(questions, answers, mode)
  if (!records.length) return result

  try {
    await batchSubmitRecords({ userId: String(userId), records })
  } catch (e) {
    console.warn('批量提交记录失败:', e)
  }
  return result
}

export function flattenSubjects(subjects, result = []) {
  ;(subjects || []).forEach((subject) => {
    result.push(subject)
    if (subject.children?.length) flattenSubjects(subject.children, result)
  })
  return result
}
