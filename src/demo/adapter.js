import { DEMO_USER } from '../utils/demoAuth'
import { getDemoState, nextDemoId, nodeName, persistDemoState } from './store'

function parseBody(data) {
  if (data == null) return {}
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return {}
    }
  }
  return data
}

function parseRequest(config) {
  const method = String(config.method || 'get').toUpperCase()
  const joined = `${config.baseURL || ''}${config.url || ''}`
  const url = new URL(joined, 'http://demo.local')
  const pathname = url.pathname.replace(/^\/api/, '') || '/'
  const params = { ...Object.fromEntries(url.searchParams.entries()), ...(config.params || {}) }
  return { method, pathname, params, body: parseBody(config.data) }
}

function ok(data, extra = {}) {
  return { success: true, data, ...extra }
}

function paginate(list, params = {}) {
  const page = Math.max(1, Number(params.page) || 1)
  const limit = Math.max(1, Number(params.limit) || 20)
  const total = list.length
  const start = (page - 1) * limit
  const items = list.slice(start, start + limit)
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1)
  return { items, total, page, limit, totalPages }
}

function me() {
  return getDemoState().profile || DEMO_USER
}

function subjectTree(subjects) {
  const byCode = new Map(subjects.map((s) => [s.code, { ...s, children: [] }]))
  const roots = []
  byCode.forEach((s) => {
    if (s.parentCode && byCode.has(s.parentCode)) byCode.get(s.parentCode).children.push(s)
    else roots.push(s)
  })
  return roots
}

function matchQuestion(q, params) {
  if (params.subjectCode && q.subjectCode !== params.subjectCode) return false
  if (params.bankId && q.bankId !== params.bankId && q.bankKey !== params.bankId) return false
  if (params.knowledgeNodeId && q.knowledgeNodeId !== params.knowledgeNodeId) return false
  if (params.search) {
    const s = String(params.search).toLowerCase()
    if (!String(q.content || '').toLowerCase().includes(s)) return false
  }
  if (params.difficulty) {
    const d = params.difficulty
    const allowed = typeof d === 'string' && d.startsWith('[') ? JSON.parse(d) : Array.isArray(d) ? d : [d]
    if (!allowed.map(Number).includes(Number(q.difficulty))) return false
  }
  return true
}

function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function masteryFromRecords(state) {
  const byNode = {}
  const bySubject = {}
  const byType = {}
  let total = 0
  let correct = 0
  state.records.forEach((r) => {
    total += 1
    if (r.isCorrect) correct += 1
    const key = r.knowledgeNodeId || 'unknown'
    byNode[key] = byNode[key] || { key, knowledgeNodeId: key, name: nodeName(key), total: 0, correct: 0 }
    byNode[key].total += 1
    if (r.isCorrect) byNode[key].correct += 1
    const sc = r.subjectCode || 'unknown'
    bySubject[sc] = bySubject[sc] || { subjectCode: sc, name: sc, total: 0, correct: 0 }
    bySubject[sc].total += 1
    if (r.isCorrect) bySubject[sc].correct += 1
    const t = r.type || 'single'
    byType[t] = byType[t] || { type: t, name: t, total: 0, correct: 0 }
    byType[t].total += 1
    if (r.isCorrect) byType[t].correct += 1
  })
  const finish = (row) => {
    const accuracy = row.total ? (row.correct / row.total) * 100 : 0
    return { ...row, accuracy, masteryPercent: Math.round(accuracy), practiceCount: row.total }
  }
  return {
    overall: { total, correct, wrong: total - correct, accuracy: total ? (correct / total) * 100 : 0 },
    knowledgeNodes: Object.values(byNode).map(finish),
    bySubject: Object.values(bySubject).map(finish),
    byType: Object.values(byType).map(finish),
  }
}

function trendFromRecords(state, days = 30) {
  const map = {}
  state.records.forEach((r) => {
    const date = String(r.createdAt || '').slice(0, 10)
    if (!date) return
    map[date] = map[date] || { date, total: 0, correct: 0 }
    map[date].total += 1
    if (r.isCorrect) map[date].correct += 1
  })
  return Object.values(map)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-Number(days) || 30)
    .map((row) => ({ ...row, accuracy: row.total ? row.correct / row.total : 0 }))
}

function dueWrong(state) {
  return (state.wrongQuestions || []).filter((w) => w.masteryStatus !== 'mastered' && !w.isMastered)
}

function handle(config) {
  const { method, pathname, params, body } = parseRequest(config)
  const state = getDemoState()
  const save = () => persistDemoState()
  const key = `${method} ${pathname}`

  if (key === 'GET /auth/csrf-token') return { csrfToken: 'demo-csrf' }
  if (key === 'GET /auth/me') return { user: me(), success: true }
  if (pathname === '/auth/oauth/github/url' || pathname === '/auth/oauth/wechat/url') {
    return { success: false, message: '纯前端演示不支持真实 OAuth，请使用演示登录或在设置中模拟绑定' }
  }
  if (key === 'PUT /auth/me') {
    Object.assign(state.profile, body)
    save()
    if (body?.name) {
      import('../utils/localAuth.js').then((m) =>
        m.updateLocalAccountProfile(state.profile.email, { name: body.name }),
      )
    }
    return { success: true, user: state.profile, data: state.profile }
  }
  if (key === 'PUT /auth/me/password') {
    return import('../utils/localAuth.js').then(async (m) => {
      try {
        await m.changeLocalPassword(me().email, body.oldPassword, body.newPassword)
        return { success: true, message: '密码已更新' }
      } catch (e) {
        return { success: false, message: e?.message || '修改密码失败' }
      }
    })
  }

  if (key === 'GET /v3/subjects' || key === 'GET /v3/subjects/') {
    const list = params.tree === 'true' || params.tree === true ? subjectTree(state.subjects) : state.subjects
    return ok(list)
  }
  if (method === 'POST' && pathname === '/v3/subjects') {
    const item = { _id: nextDemoId('subject'), enabled: true, ...body }
    state.subjects.push(item)
    save()
    return ok(item)
  }
  const subjectCodeMatch = pathname.match(/^\/v3\/subjects\/([^/]+)$/)
  if (subjectCodeMatch && method === 'PUT') {
    const item = state.subjects.find((s) => s.code === decodeURIComponent(subjectCodeMatch[1]))
    if (item) Object.assign(item, body)
    save()
    return ok(item)
  }
  if (subjectCodeMatch && method === 'DELETE') {
    const code = decodeURIComponent(subjectCodeMatch[1])
    state.subjects = state.subjects.filter((s) => s.code !== code)
    save()
    return ok({ deleted: true })
  }

  if (pathname === '/v3/banks' && method === 'GET') {
    let list = state.banks
    if (params.subjectCode) list = list.filter((b) => b.subjectCode === params.subjectCode)
    if (params.search) {
      const s = String(params.search).toLowerCase()
      list = list.filter((b) => String(b.name).toLowerCase().includes(s))
    }
    const page = paginate(list, params)
    return { success: true, data: page.items, meta: page }
  }
  if (pathname === '/v3/banks' && method === 'POST') {
    const item = { _id: nextDemoId('bank'), questionCount: 0, isPublic: true, ...body }
    state.banks.unshift(item)
    save()
    return ok(item)
  }
  const bankMatch = pathname.match(/^\/v3\/banks\/([^/]+)$/)
  if (bankMatch && method === 'GET') {
    const item = state.banks.find((b) => b._id === bankMatch[1] || b.key === bankMatch[1])
    return ok(item)
  }
  if (bankMatch && method === 'PUT') {
    const item = state.banks.find((b) => b._id === bankMatch[1])
    if (item) Object.assign(item, body)
    save()
    return ok(item)
  }
  if (bankMatch && method === 'DELETE') {
    state.banks = state.banks.filter((b) => b._id !== bankMatch[1])
    save()
    return ok({ deleted: true })
  }

  if (pathname === '/v3/questions' && method === 'GET') {
    let list = state.questions.filter((q) => matchQuestion(q, params))
    if (params.sort === '-createdAt') list = [...list].reverse()
    const page = paginate(list, params)
    return { success: true, data: page.items, meta: page }
  }
  if (pathname === '/v3/questions' && method === 'POST') {
    const item = {
      _id: nextDemoId('q'),
      id: null,
      ...body,
      createdAt: new Date().toISOString(),
    }
    item.id = item._id
    state.questions.unshift(item)
    save()
    return ok(item)
  }
  const qMatch = pathname.match(/^\/v3\/questions\/([^/]+)$/)
  if (qMatch && method === 'GET') {
    const item = state.questions.find((q) => q._id === qMatch[1] || q.id === qMatch[1] || q.qid === qMatch[1])
    return ok(item)
  }
  if (qMatch && method === 'PUT') {
    const item = state.questions.find((q) => q._id === qMatch[1])
    if (item) Object.assign(item, body)
    save()
    return ok(item)
  }
  if (qMatch && method === 'DELETE') {
    state.questions = state.questions.filter((q) => q._id !== qMatch[1])
    save()
    return ok({ deleted: true })
  }

  if (pathname === '/questions' && method === 'GET') {
    let list = state.questions.filter((q) => matchQuestion(q, params))
    if (params.ids) {
      const ids = String(params.ids).split(',').map((x) => x.trim()).filter(Boolean)
      const map = new Map(state.questions.map((q) => [String(q._id), q]))
      list = ids.map((id) => map.get(id)).filter(Boolean)
    }
    if (params.random === 'true' || params.random === true) list = shuffle(list)
    const limit = Number(params.limit) || list.length
    return { items: list.slice(0, limit), data: list.slice(0, limit) }
  }

  if (pathname === '/graph/nodes' && method === 'GET') {
    return state.graphNodes
  }
  if (pathname === '/graph/nodes' && method === 'POST') {
    const item = { _id: body.key || nextDemoId('node'), key: body.key, name: body.name || body.key, ...body }
    state.graphNodes.push(item)
    save()
    return item
  }
  if (pathname === '/graph/stats' && method === 'GET') {
    return { nodes: state.graphNodes.length, links: Math.max(0, state.graphNodes.length - 1) }
  }
  if (pathname === '/graph/links' && method === 'GET') {
    const links = state.graphNodes.slice(1).map((n, i) => ({
      source: state.graphNodes[i].key,
      target: n.key,
    }))
    return { links }
  }
  if (pathname === '/graph/export' && method === 'GET') {
    return { nodes: state.graphNodes }
  }
  if (pathname === '/graph/import' && method === 'POST') {
    const incoming = Array.isArray(body.nodes) ? body.nodes : Array.isArray(body) ? body : []
    incoming.forEach((n) => {
      const key = n.key || n.id
      if (!key) return
      const exist = state.graphNodes.find((x) => x.key === key)
      if (exist) Object.assign(exist, { name: n.name || n.label || exist.name })
      else state.graphNodes.push({ _id: key, key, name: n.name || n.label || key })
    })
    save()
    return { imported: incoming.length }
  }
  if (pathname === '/graph/nodes/reorder' && method === 'POST') return { ok: true }
  const graphNodeMatch = pathname.match(/^\/graph\/nodes\/([^/]+)$/) || pathname.match(/^\/graph\/([^/]+)$/)
  if (graphNodeMatch && method === 'PUT') {
    const id = decodeURIComponent(graphNodeMatch[1])
    const item = state.graphNodes.find((n) => n.key === id || n._id === id)
    if (item) Object.assign(item, body)
    save()
    return item
  }
  if (graphNodeMatch && method === 'DELETE') {
    const id = decodeURIComponent(graphNodeMatch[1])
    state.graphNodes = state.graphNodes.filter((n) => n.key !== id && n._id !== id)
    save()
    return { deleted: true }
  }

  if (pathname === '/v3/friends' && method === 'GET') {
    return ok({ items: state.friendships, friends: state.friendships })
  }
  if (pathname === '/v3/friends/requests' && method === 'GET') {
    const type = params.type
    let list = state.friendRequests
    if (type === 'received') list = list.filter((r) => r.toUserId === me()._id)
    if (type === 'sent') list = list.filter((r) => r.fromUserId === me()._id)
    if (params.status) list = list.filter((r) => r.status === params.status)
    return ok({ items: list })
  }
  if (pathname === '/v3/friends/requests' && method === 'POST') {
    const to = state.users.find((u) => u._id === body.toUserId)
    const item = {
      _id: nextDemoId('fr'),
      fromUserId: me()._id,
      toUserId: body.toUserId,
      fromUser: me(),
      toUser: to,
      message: body.message || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    state.friendRequests.unshift(item)
    save()
    return ok(item)
  }
  const frAccept = pathname.match(/^\/v3\/friends\/requests\/([^/]+)\/accept$/)
  if (frAccept && method === 'PUT') {
    const req = state.friendRequests.find((r) => r._id === frAccept[1])
    if (req) {
      req.status = 'accepted'
      const user = req.fromUser
      if (user && !state.friendships.some((f) => f.friendId === user._id)) {
        state.friendships.push({ _id: nextDemoId('fs'), friendId: user._id, friend: user, createdAt: new Date().toISOString() })
      }
      save()
    }
    return ok(req)
  }
  const frReject = pathname.match(/^\/v3\/friends\/requests\/([^/]+)\/reject$/)
  if (frReject && (method === 'PUT' || method === 'DELETE')) {
    const req = state.friendRequests.find((r) => r._id === frReject[1])
    if (req) req.status = 'rejected'
    save()
    return ok(req)
  }
  const frDel = pathname.match(/^\/v3\/friends\/requests\/([^/]+)$/)
  if (frDel && method === 'DELETE') {
    state.friendRequests = state.friendRequests.filter((r) => r._id !== frDel[1])
    save()
    return ok({ deleted: true })
  }
  if (pathname === '/v3/friends/search' && method === 'GET') {
    const q = String(params.q || params.keyword || params.search || '').toLowerCase()
    const items = state.users.filter(
      (u) => u._id !== me()._id && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    )
    return ok({ items, users: items })
  }
  const friendCheck = pathname.match(/^\/v3\/friends\/check\/([^/]+)$/)
  if (friendCheck && method === 'GET') {
    const isFriend = state.friendships.some((f) => f.friendId === friendCheck[1])
    return ok({ isFriend })
  }
  const friendProfile = pathname.match(/^\/v3\/friends\/profile\/([^/]+)$/)
  if (friendProfile && method === 'GET') {
    const user = state.users.find((u) => u._id === friendProfile[1])
    return ok(user || {})
  }
  const friendDel = pathname.match(/^\/v3\/friends\/([^/]+)$/)
  if (friendDel && method === 'DELETE') {
    state.friendships = state.friendships.filter((f) => f.friendId !== friendDel[1] && f._id !== friendDel[1])
    save()
    return ok({ deleted: true })
  }

  if (pathname === '/v3/notifications' && method === 'GET') {
    let list = state.notifications
    if (params.type && params.type !== 'all') list = list.filter((n) => n.type === params.type)
    const page = paginate(list, { ...params, limit: params.limit || 20 })
    return ok({ items: page.items, notifications: page.items, ...page })
  }
  if (pathname === '/v3/notifications/unread-count' && method === 'GET') {
    return ok({ count: state.notifications.filter((n) => !n.isRead && !n.read).length })
  }
  if (pathname === '/v3/notifications/read-all' && method === 'PUT') {
    state.notifications.forEach((n) => {
      n.isRead = true
      n.read = true
    })
    save()
    return ok({ updated: true })
  }
  const notifRead = pathname.match(/^\/v3\/notifications\/([^/]+)\/read$/)
  if (notifRead && method === 'PUT') {
    const n = state.notifications.find((x) => x._id === notifRead[1])
    if (n) {
      n.isRead = true
      n.read = true
    }
    save()
    return ok(n)
  }
  const notifDel = pathname.match(/^\/v3\/notifications\/([^/]+)$/)
  if (notifDel && method === 'DELETE') {
    state.notifications = state.notifications.filter((n) => n._id !== notifDel[1])
    save()
    return ok({ deleted: true })
  }

  if (pathname === '/v3/notes' && method === 'GET') {
    let list = state.notes.filter((n) => n.userId === me()._id)
    if (params.knowledgeNodeId) {
      list = state.notes.filter(
        (n) => n.knowledgeNodeId === params.knowledgeNodeId && (n.userId === me()._id || n.isPublic),
      )
    }
    const kw = params.searchKeyword || params.q
    if (kw) {
      const s = String(kw).toLowerCase()
      list = list.filter((n) => `${n.title} ${n.content} ${(n.tags || []).join(' ')}`.toLowerCase().includes(s))
    }
    if (params.tags) {
      const tags = Array.isArray(params.tags) ? params.tags : String(params.tags).split(',')
      list = list.filter((n) => tags.some((t) => (n.tags || []).includes(String(t).trim())))
    }
    const page = paginate(list, params)
    return ok({ items: page.items, notes: page.items, ...page })
  }
  if (pathname === '/v3/notes/public' && method === 'GET') {
    const list = state.notes.filter((n) => n.isPublic)
    const page = paginate(list, params)
    return ok({ items: page.items, notes: page.items, ...page })
  }
  if (pathname === '/v3/notes/stats' && method === 'GET') {
    const mine = state.notes.filter((n) => n.userId === me()._id)
    return ok({ total: mine.length, public: mine.filter((n) => n.isPublic).length })
  }
  if (pathname === '/v3/notes' && method === 'POST') {
    const item = {
      _id: nextDemoId('note'),
      userId: me()._id,
      author: { _id: me()._id, name: me().name },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    }
    state.notes.unshift(item)
    save()
    return ok(item)
  }
  const noteShareGet = pathname.match(/^\/v3\/notes\/share\/([^/]+)$/)
  if (noteShareGet && method === 'GET') {
    const note = state.notes.find((n) => n.shareToken === noteShareGet[1] || n._id === noteShareGet[1])
    return ok(note)
  }
  const noteShare = pathname.match(/^\/v3\/notes\/([^/]+)\/share$/)
  if (noteShare && method === 'POST') {
    const note = state.notes.find((n) => n._id === noteShare[1])
    if (note) note.shareToken = note.shareToken || nextDemoId('share')
    save()
    return ok({ shareToken: note?.shareToken, token: note?.shareToken })
  }
  const noteLike = pathname.match(/^\/v3\/notes\/([^/]+)\/like$/)
  if (noteLike && method === 'POST') return ok({ liked: true })
  const noteMatch = pathname.match(/^\/v3\/notes\/([^/]+)$/)
  if (noteMatch && method === 'GET') return ok(state.notes.find((n) => n._id === noteMatch[1]))
  if (noteMatch && method === 'PUT') {
    const note = state.notes.find((n) => n._id === noteMatch[1])
    if (note) Object.assign(note, body, { updatedAt: new Date().toISOString() })
    save()
    return ok(note)
  }
  if (noteMatch && method === 'DELETE') {
    state.notes = state.notes.filter((n) => n._id !== noteMatch[1])
    save()
    return ok({ deleted: true })
  }

  if (pathname === '/v3/wrong-questions' && method === 'GET') {
    let list = state.wrongQuestions
    if (params.masteryStatus === 'mastered') list = list.filter((w) => w.masteryStatus === 'mastered' || w.isMastered)
    if (params.masteryStatus === 'unmastered') list = list.filter((w) => w.masteryStatus !== 'mastered' && !w.isMastered)
    if (params.searchKeyword) {
      const s = String(params.searchKeyword).toLowerCase()
      list = list.filter((w) => String(w.question?.content || '').toLowerCase().includes(s))
    }
    const page = paginate(list, params)
    return ok({ items: page.items, ...page })
  }
  if (pathname === '/v3/wrong-questions/stats' && method === 'GET') {
    const all = state.wrongQuestions
    const mastered = all.filter((w) => w.masteryStatus === 'mastered' || w.isMastered).length
    return ok({ total: all.length, mastered, unmastered: all.length - mastered })
  }
  const wqMaster = pathname.match(/^\/v3\/wrong-questions\/([^/]+)\/mastered$/)
  if (wqMaster && method === 'PUT') {
    const row = state.wrongQuestions.find((w) => w.questionId === wqMaster[1] || w._id === wqMaster[1])
    if (row) {
      row.masteryStatus = 'mastered'
      row.isMastered = true
      row.mastery = 90
    }
    save()
    return ok(row)
  }
  if (wqMaster && method === 'DELETE') {
    const row = state.wrongQuestions.find((w) => w.questionId === wqMaster[1] || w._id === wqMaster[1])
    if (row) {
      row.masteryStatus = 'unmastered'
      row.isMastered = false
      row.mastery = 10
    }
    save()
    return ok(row)
  }
  const wqDel = pathname.match(/^\/v3\/wrong-questions\/([^/]+)$/)
  if (wqDel && method === 'DELETE') {
    state.wrongQuestions = state.wrongQuestions.filter((w) => w.questionId !== wqDel[1] && w._id !== wqDel[1])
    save()
    return ok({ deleted: true })
  }

  if (pathname === '/v3/study-plans' && method === 'GET') {
    const page = paginate(state.studyPlans, params)
    return ok({ items: page.items, plans: page.items, ...page })
  }
  if (pathname === '/v3/study-plans' && method === 'POST') {
    const item = { _id: nextDemoId('plan'), userId: me()._id, status: 'active', ...body }
    state.studyPlans.unshift(item)
    save()
    return ok(item)
  }
  if (pathname === '/v3/study-plans/stats' && method === 'GET') {
    return ok({
      totalPlans: state.studyPlans.length,
      activePlans: state.studyPlans.filter((p) => p.status === 'active').length,
      checkInDays: state.checkIns.length,
      totalCheckIns: state.checkIns.length,
      streak: state.studyPlans[0]?.stats?.currentStreak || 3,
    })
  }
  if (pathname === '/v3/study-plans/check-ins' && method === 'GET') {
    const page = paginate(state.checkIns, params)
    return ok({ items: page.items, ...page })
  }
  const planCheck = pathname.match(/^\/v3\/study-plans\/([^/]+)\/check-in$/)
  if (planCheck && method === 'POST') {
    const item = {
      _id: nextDemoId('checkin'),
      userId: me()._id,
      planId: planCheck[1],
      date: body.date || new Date().toISOString(),
      ...body,
    }
    state.checkIns.unshift(item)
    save()
    return ok(item)
  }
  const planMatch = pathname.match(/^\/v3\/study-plans\/([^/]+)$/)
  if (planMatch && method === 'PUT') {
    const item = state.studyPlans.find((p) => p._id === planMatch[1])
    if (item) Object.assign(item, body)
    save()
    return ok(item)
  }
  if (planMatch && method === 'DELETE') {
    state.studyPlans = state.studyPlans.filter((p) => p._id !== planMatch[1])
    save()
    return ok({ deleted: true })
  }

  if (pathname === '/v3/review-plans' && method === 'GET') {
    let list = state.reviewPlans
    if (params.status) list = list.filter((p) => p.status === params.status)
    return ok(list)
  }
  if (pathname === '/v3/review-plans' && method === 'POST') {
    const item = { _id: nextDemoId('rplan'), userId: me()._id, status: 'active', ...body }
    state.reviewPlans.unshift(item)
    save()
    return ok(item)
  }
  const rpExec = pathname.match(/^\/v3\/review-plans\/([^/]+)\/execute$/)
  if (rpExec && method === 'POST') {
    const ids = dueWrong(state).slice(0, 10).map((w) => w.questionId)
    return ok({ questionIds: ids, count: ids.length })
  }
  const rpStats = pathname.match(/^\/v3\/review-plans\/([^/]+)\/stats$/)
  if (rpStats && method === 'GET') {
    return ok({ dueCount: dueWrong(state).length, total: state.wrongQuestions.length })
  }
  const rpDel = pathname.match(/^\/v3\/review-plans\/([^/]+)$/)
  if (rpDel && method === 'DELETE') {
    state.reviewPlans = state.reviewPlans.filter((p) => p._id !== rpDel[1])
    save()
    return ok({ deleted: true })
  }

  if (pathname === '/v3/learning-goals' && method === 'GET') return ok(state.learningGoals)
  if (pathname === '/v3/learning-goals' && method === 'POST') {
    const item = { _id: nextDemoId('goal'), userId: me()._id, currentValue: 0, status: 'active', ...body }
    state.learningGoals.unshift(item)
    save()
    return ok(item)
  }
  if (pathname === '/v3/learning-goals/stats' && method === 'GET') {
    return ok({
      total: state.learningGoals.length,
      active: state.learningGoals.filter((g) => g.status === 'active').length,
      completed: state.learningGoals.filter((g) => g.status === 'completed').length,
    })
  }
  const goalMatch = pathname.match(/^\/v3\/learning-goals\/([^/]+)$/)
  if (goalMatch && method === 'PUT') {
    const item = state.learningGoals.find((g) => g._id === goalMatch[1])
    if (item) Object.assign(item, body)
    save()
    return ok(item)
  }
  if (goalMatch && method === 'DELETE') {
    state.learningGoals = state.learningGoals.filter((g) => g._id !== goalMatch[1])
    save()
    return ok({ deleted: true })
  }

  if (pathname === '/v3/favorites/folders' && method === 'GET') return ok(state.favoriteFolders)
  if (pathname === '/v3/favorites/folders' && method === 'POST') {
    const item = { _id: nextDemoId('fav-folder'), userId: me()._id, ...body }
    state.favoriteFolders.push(item)
    save()
    return ok(item)
  }
  const favFolderDel = pathname.match(/^\/v3\/favorites\/folders\/([^/]+)$/)
  if (favFolderDel && method === 'DELETE') {
    state.favoriteFolders = state.favoriteFolders.filter((f) => f._id !== favFolderDel[1])
    save()
    return ok({ deleted: true })
  }
  if (pathname === '/v3/favorites' && method === 'GET') {
    let list = state.favorites
    if (params.folderId) list = list.filter((f) => f.folderId === params.folderId)
    if (params.searchKeyword) {
      const s = String(params.searchKeyword).toLowerCase()
      list = list.filter((f) => String(f.question?.content || '').toLowerCase().includes(s))
    }
    const page = paginate(list, params)
    return ok({ items: page.items, ...page })
  }
  const favDel = pathname.match(/^\/v3\/favorites\/([^/]+)\/([^/]+)$/)
  if (favDel && method === 'DELETE') {
    state.favorites = state.favorites.filter((f) => !(f.questionId === favDel[1] && f.folderId === favDel[2]))
    save()
    return ok({ deleted: true })
  }

  if (pathname === '/v3/achievements' && method === 'GET') return ok(state.achievements)
  if (pathname === '/v3/achievements/stats' && method === 'GET') {
    return ok({ unlocked: state.achievements.length, total: state.achievements.length })
  }
  if (pathname === '/v3/achievements/check' && method === 'POST') return ok({ newlyUnlocked: [] })

  if (pathname === '/v3/messages' && method === 'POST') {
    const item = {
      _id: nextDemoId('msg'),
      senderId: me()._id,
      receiverId: body.receiverId,
      sender: { _id: me()._id, name: me().name },
      content: body.content,
      createdAt: new Date().toISOString(),
    }
    state.messages.push(item)
    const friend = state.users.find((u) => u._id === body.receiverId)
    if (friend) {
      state.messages.push({
        _id: nextDemoId('msg'),
        senderId: friend._id,
        receiverId: me()._id,
        sender: { _id: friend._id, name: friend.name },
        content: '收到！一起加油刷题～',
        createdAt: new Date(Date.now() + 800).toISOString(),
      })
    }
    save()
    return ok(item)
  }
  if (pathname === '/v3/messages/conversations' && method === 'GET') {
    const myId = me()._id
    const map = new Map()
    state.messages.forEach((m) => {
      const other = m.senderId === myId ? m.receiverId : m.senderId
      if (!other) return
      const user = state.users.find((u) => u._id === other) || {}
      const prev = map.get(other)
      if (!prev || String(m.createdAt) > String(prev.lastMessage?.createdAt)) {
        map.set(other, {
          userId: other,
          _id: other,
          name: user.name,
          email: user.email,
          lastMessage: { content: m.content, createdAt: m.createdAt },
        })
      }
    })
    return ok([...map.values()])
  }
  if (pathname === '/v3/messages/unread' && method === 'GET') {
    return ok({ count: state.messages.filter((m) => m.receiverId === me()._id && !m.isRead).length })
  }
  const msgRead = pathname.match(/^\/v3\/messages\/read\/([^/]+)$/)
  if (msgRead && method === 'PUT') {
    state.messages.forEach((m) => {
      if (m.senderId === msgRead[1]) m.isRead = true
    })
    save()
    return ok({ updated: true })
  }
  const msgConv = pathname.match(/^\/v3\/messages\/conversation\/([^/]+)$/)
  if (msgConv && method === 'GET') {
    const other = msgConv[1]
    const myId = me()._id
    const items = state.messages.filter(
      (m) => (m.senderId === myId && m.receiverId === other) || (m.senderId === other && m.receiverId === myId),
    )
    return ok({ items, messages: items })
  }

  if (pathname === '/v3/discussions' && method === 'GET') {
    const page = paginate(state.discussions, params)
    return ok({ items: page.items, discussions: page.items, ...page })
  }
  if (pathname === '/v3/discussions' && method === 'POST') {
    const item = {
      _id: nextDemoId('disc'),
      author: { _id: me()._id, name: me().name },
      userId: me()._id,
      replies: [],
      replyCount: 0,
      likeCount: 0,
      createdAt: new Date().toISOString(),
      ...body,
    }
    state.discussions.unshift(item)
    save()
    return ok(item)
  }
  const discReply = pathname.match(/^\/v3\/discussions\/([^/]+)\/replies$/)
  if (discReply && method === 'POST') {
    const disc = state.discussions.find((d) => d._id === discReply[1])
    const reply = {
      _id: nextDemoId('reply'),
      author: { _id: me()._id, name: me().name },
      content: body.content,
      createdAt: new Date().toISOString(),
    }
    if (disc) {
      disc.replies = disc.replies || []
      disc.replies.push(reply)
      disc.replyCount = disc.replies.length
    }
    save()
    return ok(reply)
  }
  const discLike = pathname.match(/^\/v3\/discussions\/([^/]+)\/like$/)
  if (discLike && method === 'PUT') {
    const disc = state.discussions.find((d) => d._id === discLike[1])
    if (disc) disc.likeCount = (disc.likeCount || 0) + 1
    save()
    return ok(disc)
  }
  const discMatch = pathname.match(/^\/v3\/discussions\/([^/]+)$/)
  if (discMatch && method === 'GET') return ok(state.discussions.find((d) => d._id === discMatch[1]))

  if (pathname === '/v3/learning-posts' && method === 'GET') {
    const page = paginate(state.learningPosts, params)
    return ok({ items: page.items, posts: page.items, ...page })
  }
  if (pathname === '/v3/learning-posts' && method === 'POST') {
    const item = {
      _id: nextDemoId('post'),
      userId: me()._id,
      author: { _id: me()._id, name: me().name },
      likeCount: 0,
      createdAt: new Date().toISOString(),
      ...body,
    }
    state.learningPosts.unshift(item)
    save()
    return ok(item)
  }
  const postLike = pathname.match(/^\/v3\/learning-posts\/([^/]+)\/like$/)
  if (postLike && method === 'PUT') {
    const post = state.learningPosts.find((p) => p._id === postLike[1])
    if (post) post.likeCount = (post.likeCount || 0) + 1
    save()
    return ok(post)
  }

  if (pathname === '/v3/leaderboard' && method === 'GET') {
    const type = params.type || 'total'
    const items = state.users.map((u, i) => {
      const accuracy = 0.72 + (i % 5) * 0.04
      const total = u.points || 100 + (state.users.length - i) * 30
      const streak = ((u.points || i * 17) % 9) + 1
      let value = total
      if (type === 'accuracy') value = Math.round(accuracy * 1000) / 10
      else if (type === 'streak') value = streak
      else if (type === 'weekly') value = Math.round(total * 0.35)
      else if (type === 'monthly') value = Math.round(total * 0.7)
      return {
        rank: i + 1,
        userId: u._id,
        name: u.name,
        email: u.email,
        value,
        total,
        streak,
        accuracy,
      }
    })
    items.sort((a, b) => b.value - a.value)
    items.forEach((row, i) => {
      row.rank = i + 1
    })
    return ok(items)
  }

  if (pathname === '/v3/groups' && method === 'GET') return ok(state.groups)
  if (pathname === '/v3/groups' && method === 'POST') {
    const item = {
      _id: nextDemoId('group'),
      ownerId: me()._id,
      code: `G${Date.now().toString().slice(-4)}`,
      members: [{ userId: me()._id, user: me(), role: 'owner' }],
      memberCount: 1,
      ...body,
    }
    state.groups.unshift(item)
    save()
    return ok(item)
  }
  if (pathname === '/v3/groups/join' && method === 'POST') {
    const group = state.groups.find((g) => g.code === body.code)
    if (!group) return { success: false, message: '邀请码无效' }
    if (!group.members.some((m) => m.userId === me()._id)) {
      group.members.push({ userId: me()._id, user: me(), role: 'member' })
      group.memberCount = group.members.length
      save()
    }
    return ok(group)
  }
  const groupMatch = pathname.match(/^\/v3\/groups\/([^/]+)$/)
  if (groupMatch && method === 'GET') return ok(state.groups.find((g) => g._id === groupMatch[1]))
  if (groupMatch && method === 'PUT') {
    const group = state.groups.find((g) => g._id === groupMatch[1])
    if (group) Object.assign(group, body)
    save()
    return ok(group)
  }
  if (groupMatch && method === 'DELETE') {
    state.groups = state.groups.filter((g) => g._id !== groupMatch[1])
    save()
    return ok({ deleted: true })
  }
  const groupMem = pathname.match(/^\/v3\/groups\/([^/]+)\/members\/([^/]+)$/)
  if (groupMem && method === 'DELETE') {
    const group = state.groups.find((g) => g._id === groupMem[1])
    if (group) {
      group.members = group.members.filter((m) => m.userId !== groupMem[2])
      group.memberCount = group.members.length
    }
    save()
    return ok({ deleted: true })
  }

  if (pathname === '/v3/mentor/relations' && method === 'GET') return ok(state.mentorRelations)
  if (pathname === '/v3/mentor/applications' && method === 'GET') return ok([])
  if (pathname === '/v3/mentor/apply' && method === 'POST') {
    const master = state.users.find((u) => u._id === body.masterId)
    const item = {
      _id: nextDemoId('mentor'),
      masterId: body.masterId,
      apprenticeId: me()._id,
      master,
      apprentice: me(),
      status: 'pending',
    }
    state.mentorRelations.push(item)
    save()
    return ok(item)
  }
  const mentorAcc = pathname.match(/^\/v3\/mentor\/relations\/([^/]+)\/accept$/)
  if (mentorAcc && method === 'PUT') {
    const item = state.mentorRelations.find((r) => r._id === mentorAcc[1])
    if (item) item.status = 'active'
    save()
    return ok(item)
  }
  const mentorRej = pathname.match(/^\/v3\/mentor\/relations\/([^/]+)\/reject$/)
  if (mentorRej && method === 'PUT') {
    const item = state.mentorRelations.find((r) => r._id === mentorRej[1])
    if (item) item.status = 'rejected'
    save()
    return ok(item)
  }

  if (pathname === '/v3/friend-challenges' && method === 'GET') return ok(state.friendChallenges)
  if (pathname === '/v3/friend-challenges' && method === 'POST') {
    const item = {
      _id: nextDemoId('chal'),
      initiatorId: me()._id,
      initiator: me(),
      participant: state.users.find((u) => u._id === body.participantId),
      status: 'pending',
      initiatorProgress: 0,
      participantProgress: 0,
      ...body,
    }
    state.friendChallenges.unshift(item)
    save()
    return ok(item)
  }
  if (pathname === '/v3/friend-challenges/stats' && method === 'GET') {
    return ok({ total: state.friendChallenges.length, active: state.friendChallenges.filter((c) => c.status === 'active').length })
  }
  const chalAcc = pathname.match(/^\/v3\/friend-challenges\/([^/]+)\/accept$/)
  if (chalAcc && method === 'PUT') {
    const item = state.friendChallenges.find((c) => c._id === chalAcc[1])
    if (item) item.status = 'active'
    save()
    return ok(item)
  }
  const chalCancel = pathname.match(/^\/v3\/friend-challenges\/([^/]+)\/cancel$/)
  if (chalCancel && method === 'PUT') {
    const item = state.friendChallenges.find((c) => c._id === chalCancel[1])
    if (item) item.status = 'cancelled'
    save()
    return ok(item)
  }
  const chalProg = pathname.match(/^\/v3\/friend-challenges\/([^/]+)\/progress$/)
  if (chalProg && method === 'PUT') {
    const item = state.friendChallenges.find((c) => c._id === chalProg[1])
    if (item) item.initiatorProgress = (item.initiatorProgress || 0) + 1
    save()
    return ok(item)
  }

  if (pathname === '/v3/recommendations/questions' && method === 'GET') {
    let list = state.questions.filter((q) => matchQuestion(q, params))
    const weakIds = new Set(dueWrong(state).map((w) => w.questionId))
    if (params.strategy === 'weak_points' || params.strategy === 'weakness') {
      const weak = list.filter((q) => weakIds.has(q._id))
      list = weak.length ? weak : list
    }
    list = shuffle(list).slice(0, Number(params.limit) || 10)
    return ok(list.map((q) => ({ ...q, reason: '基于演示错题与掌握度推荐' })))
  }

  if (pathname === '/v3/enhanced-analytics/forgetting-curve' && method === 'GET') {
    const items = dueWrong(state).slice(0, 8).map((w) => ({
      knowledgeNodeId: w.knowledgeNodeId,
      name: nodeName(w.knowledgeNodeId),
      _id: w._id,
    }))
    return ok(items)
  }
  if (pathname === '/v3/enhanced-analytics/comprehensive' && method === 'GET') {
    return ok({
      efficiency: { score: 82 },
      review: { todayCount: dueWrong(state).length },
      todayReviewCount: dueWrong(state).length,
    })
  }
  if (pathname === '/v3/enhanced-analytics/graph-heatmap' && method === 'GET') {
    const mastery = masteryFromRecords(state)
    return ok(mastery.knowledgeNodes)
  }
  if (pathname === '/v3/enhanced-analytics/skill-tree' && method === 'GET') {
    const mastery = masteryFromRecords(state)
    const nodes = mastery.knowledgeNodes
      .filter((n) => !params.subjectCode || state.questions.some((q) => q.knowledgeNodeId === n.key && q.subjectCode === params.subjectCode))
      .map((n) => ({
        ...n,
        lit: (n.masteryPercent || 0) >= 70 && (n.practiceCount || 0) >= 3,
      }))
    return ok({ nodes })
  }

  if (pathname === '/analytics/mastery' && method === 'GET') return ok(masteryFromRecords(state))
  if (pathname === '/analytics/trend' && method === 'GET') return ok(trendFromRecords(state, params.days))

  if ((pathname === '/records' || pathname === '/records/batch') && method === 'POST') {
    const incoming = Array.isArray(body.records) ? body.records : [body]
    incoming.forEach((r) => {
      state.records.push({
        _id: nextDemoId('rec'),
        userId: body.userId || me()._id,
        createdAt: new Date().toISOString(),
        ...r,
      })
      if (r.isCorrect === false) {
        const q = state.questions.find((x) => x._id === r.questionId)
        if (q && !state.wrongQuestions.some((w) => w.questionId === q._id)) {
          state.wrongQuestions.unshift({
            _id: nextDemoId('wq'),
            questionId: q._id,
            question: q,
            masteryStatus: 'unmastered',
            isMastered: false,
            wrongCount: 1,
            subjectCode: q.subjectCode,
            knowledgeNodeId: q.knowledgeNodeId,
            updatedAt: new Date().toISOString(),
          })
        }
      }
    })
    save()
    return { success: true, inserted: incoming.length }
  }
  if (pathname === '/records/wrong' && method === 'GET') return state.wrongQuestions

  if (pathname === '/users' && method === 'GET') {
    let list = state.users
    if (params.search) {
      const s = String(params.search).toLowerCase()
      list = list.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(s))
    }
    if (params.role) list = list.filter((u) => u.role === params.role)
    const page = paginate(list, params)
    return { success: true, data: page.items, meta: page }
  }
  const userRole = pathname.match(/^\/users\/([^/]+)\/role$/)
  if (userRole && (method === 'PATCH' || method === 'PUT')) {
    const user = state.users.find((u) => u._id === userRole[1])
    if (user) user.role = body.role
    save()
    return ok(user)
  }
  if (pathname === '/users/operation-logs' && method === 'GET') {
    const page = paginate(state.operationLogs, params)
    return { success: true, data: page.items, meta: page }
  }
  if (pathname === '/users/operation-logs/stats' && method === 'GET') {
    return ok({ total: state.operationLogs.length })
  }

  if (pathname === '/admin/stats' && method === 'GET') {
    return ok({
      users: state.users.length,
      questions: state.questions.length,
      banks: state.banks.length,
      records: state.records.length,
    })
  }
  if (pathname === '/admin/reports/generate' && method === 'POST') {
    return ok({
      generatedAt: new Date().toISOString(),
      summary: { users: state.users.length, questions: state.questions.length },
    })
  }
  if (pathname === '/admin/export/all' && method === 'GET') return { collections: state }
  if (pathname === '/admin/import' && method === 'POST') return { success: true }

  if (pathname === '/v3/role-applications' && method === 'GET') return ok(state.roleApplications)
  if (pathname === '/v3/role-applications' && method === 'POST') {
    const item = {
      _id: nextDemoId('role-app'),
      userId: me()._id,
      user: me(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...body,
    }
    state.roleApplications.unshift(item)
    save()
    return ok(item)
  }
  const roleApprove = pathname.match(/^\/v3\/role-applications\/([^/]+)\/approve$/)
  if (roleApprove && method === 'POST') {
    const item = state.roleApplications.find((r) => r._id === roleApprove[1])
    if (item) item.status = 'approved'
    save()
    return ok(item)
  }
  const roleReject = pathname.match(/^\/v3\/role-applications\/([^/]+)\/reject$/)
  if (roleReject && method === 'POST') {
    const item = state.roleApplications.find((r) => r._id === roleReject[1])
    if (item) item.status = 'rejected'
    save()
    return ok(item)
  }

  if (pathname === '/v3/ai/generate-questions' && method === 'POST') {
    return ok({
      questions: state.questions.slice(0, 3).map((q) => ({
        ...q,
        _id: nextDemoId('aiq'),
        content: `【AI 演示】${q.content}`,
      })),
    })
  }
  if (pathname === '/v3/ai/stats' && method === 'GET') return ok({ generated: 12, remaining: 88 })

  if (pathname === '/v3/shop/items' && method === 'GET') return ok(state.shopItems || [])
  if (pathname === '/v3/shop/inventory' && method === 'GET') {
    return ok(state.shopInventory || { points: me().points || 0, items: [] })
  }
  if (pathname === '/v3/shop/purchase' && method === 'POST') {
    const inv = state.shopInventory || { points: 0, items: [] }
    const item = (state.shopItems || []).find((x) => x.id === body.itemId)
    if (!item) return { success: false, message: '商品不存在' }
    if (inv.points < item.cost) return { success: false, message: '积分不足' }
    inv.points -= item.cost
    const have = inv.items.find((x) => x.id === item.id)
    if (have) have.quantity += 1
    else inv.items.push({ id: item.id, name: item.name, icon: item.icon, quantity: 1 })
    state.shopInventory = inv
    save()
    return ok(inv)
  }
  if (pathname === '/v3/shop/use' && method === 'POST') {
    const inv = state.shopInventory || { items: [] }
    const have = (inv.items || []).find((x) => x.id === body.itemId)
    if (!have || have.quantity < 1) return { success: false, message: '背包中没有该道具' }
    have.quantity -= 1
    inv.items = inv.items.filter((x) => x.quantity > 0)
    save()
    return ok({ message: `已使用「${have.name}」`, inventory: inv })
  }

  if (pathname === '/v3/oauth/binds' && method === 'GET') {
    return ok(state.oauthBinds || { github: false, wechat: false })
  }
  if (pathname === '/v3/oauth/bind' && method === 'POST') {
    state.oauthBinds = state.oauthBinds || { github: false, wechat: false }
    state.oauthBinds[body.provider] = true
    save()
    return ok(state.oauthBinds)
  }
  if (pathname === '/v3/oauth/unbind' && method === 'POST') {
    state.oauthBinds = state.oauthBinds || { github: false, wechat: false }
    state.oauthBinds[body.provider] = false
    save()
    return ok(state.oauthBinds)
  }

  if (pathname === '/v3/enhanced-analytics/path-recommendations' && method === 'GET') {
    const mastery = masteryFromRecords(state)
    const weak = mastery.knowledgeNodes
      .filter((n) => (n.masteryPercent || 0) < 70)
      .slice(0, Number(params.limit) || 5)
      .map((n) => ({ key: n.key, name: n.name, masteryPercent: n.masteryPercent, reason: '掌握度偏低，建议优先复习' }))
    return ok(weak)
  }

  if (method === 'GET') return ok([])
  if (method === 'DELETE') return ok({ deleted: true })
  return ok({ _id: nextDemoId('demo'), ...body })
}

export function demoAdapter(config) {
  return Promise.resolve()
    .then(() => handle(config))
    .then((data) => {
      if (data && data.success === false) {
        const error = new Error(data.message || '演示请求失败')
        error.response = { status: 400, data, config }
        throw error
      }
      return {
        data,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config,
        request: { demo: true },
      }
    })
}
