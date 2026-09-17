import demoContent from './data/demo-content.json'
import demoUser from './data/demo-user-content.json'
import { DEMO_USER } from '../utils/demoAuth'

const STORAGE_KEY = 'gt_demo_store_v1'

const NODE_NAMES = {
  'ds:complexity': '时间复杂度',
  'ds:stack': '栈',
  'ds:queue': '队列',
  'ds:linked-list': '链表',
  'ds:tree': '树',
  'ds:heap': '堆',
  'ds:hash': '哈希表',
  'ds:graph': '图',
  'ds:sort': '排序',
  'net:osi': 'OSI 模型',
  'net:tcp': 'TCP',
  'net:ip': 'IP 地址',
  'net:http': 'HTTP',
  'net:dns': 'DNS',
  'net:udp': 'UDP',
  'net:router': '路由器',
  'net:https': 'HTTPS',
  'web:html': 'HTML',
  'web:css': 'CSS',
  'web:js': 'JavaScript',
}

const EXTRA_WEB_QUESTIONS = [
  {
    id: 'web-001',
    qid: 'CS-WEB-001',
    subjectCode: 'CS-WEB',
    bankKey: 'demo-cs-web',
    knowledgeNodeId: 'web:html',
    type: 'single',
    difficulty: 1,
    content: 'HTML 中用于创建超链接的标签是？',
    options: ['<p>', '<a>', '<div>', '<span>'],
    answerIndex: 1,
    explain: '<a> 标签用于定义超链接。',
  },
  {
    id: 'web-002',
    qid: 'CS-WEB-002',
    subjectCode: 'CS-WEB',
    bankKey: 'demo-cs-web',
    knowledgeNodeId: 'web:css',
    type: 'single',
    difficulty: 1,
    content: 'CSS 中用于设置文字颜色的属性是？',
    options: ['font-size', 'background', 'color', 'border'],
    answerIndex: 2,
    explain: 'color 控制文字颜色。',
  },
  {
    id: 'web-003',
    qid: 'CS-WEB-003',
    subjectCode: 'CS-WEB',
    bankKey: 'demo-cs-web',
    knowledgeNodeId: 'web:js',
    type: 'single',
    difficulty: 2,
    content: 'JavaScript 中声明常量应使用？',
    options: ['var', 'let', 'const', 'static'],
    answerIndex: 2,
    explain: 'const 声明不可重新赋值的常量。',
  },
  {
    id: 'web-004',
    qid: 'CS-WEB-004',
    subjectCode: 'CS-WEB',
    bankKey: 'demo-cs-web',
    knowledgeNodeId: 'web:html',
    type: 'judge',
    difficulty: 1,
    content: 'HTML5 新增了 header、nav、article 等语义化标签。',
    options: ['正确', '错误'],
    answerIndex: 0,
    explain: 'HTML5 引入了多种语义化结构标签。',
  },
  {
    id: 'web-005',
    qid: 'CS-WEB-005',
    subjectCode: 'CS-WEB',
    bankKey: 'demo-cs-web',
    knowledgeNodeId: 'web:js',
    type: 'multiple',
    difficulty: 2,
    content: '以下哪些是 JavaScript 基本类型？',
    options: ['string', 'number', 'object', 'boolean'],
    answerIndex: [0, 1, 3],
    explain: 'string / number / boolean / undefined / null / symbol / bigint 为基本类型；object 是引用类型。',
  },
]

function daysAgo(n, hours = 12) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hours, 0, 0, 0)
  return d.toISOString()
}

function dayStartIso(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function normalizeQuestion(raw, bankIdByKey) {
  const answer = raw.answerIndex
  return {
    _id: raw.id,
    id: raw.id,
    qid: raw.qid,
    subjectCode: raw.subjectCode,
    bankId: bankIdByKey[raw.bankKey] || raw.bankKey,
    bankKey: raw.bankKey,
    knowledgeNodeId: raw.knowledgeNodeId,
    type: raw.type,
    difficulty: raw.difficulty,
    content: raw.content,
    options: raw.options || [],
    answerIndex: answer,
    answer,
    explain: raw.explain,
    explanation: raw.explain,
    createdAt: daysAgo(20),
  }
}

function buildFreshState() {
  const profile = {
    ...DEMO_USER,
    ...(demoUser.targetProfile || {}),
    email: DEMO_USER.email,
    _id: DEMO_USER._id,
    id: DEMO_USER.id,
    role: 'admin',
    isAdmin: true,
    isDemo: true,
    bio: '演示账号，数据来自 GraphTutor 后端 seed。',
    createdAt: daysAgo(90),
  }

  const subjects = (demoContent.subjects || []).map((s, i) => ({
    _id: `subject-${s.code}`,
    code: s.code,
    name: s.name,
    level: s.level,
    parentCode: s.parentCode || null,
    description: s.description || '',
    color: s.color,
    icon: s.icon,
    order: s.order ?? i,
    enabled: true,
  }))

  const banks = (demoContent.banks || []).map((b) => ({
    _id: b.key,
    key: b.key,
    name: b.name,
    subjectCode: b.subjectCode,
    description: b.description,
    isOfficial: !!b.isOfficial,
    isPublic: b.isPublic !== false,
    questionCount: 0,
    createdAt: daysAgo(40),
  }))
  const bankIdByKey = Object.fromEntries(banks.map((b) => [b.key, b._id]))

  const questions = [...(demoContent.questions || []), ...EXTRA_WEB_QUESTIONS].map((q) =>
    normalizeQuestion(q, bankIdByKey),
  )
  const countByBank = {}
  questions.forEach((q) => {
    countByBank[q.bankId] = (countByBank[q.bankId] || 0) + 1
  })
  banks.forEach((b) => {
    b.questionCount = countByBank[b._id] || 0
  })

  const graphNodes = []
  const seen = new Set()
  questions.forEach((q) => {
    const key = q.knowledgeNodeId
    if (!key || seen.has(key)) return
    seen.add(key)
    graphNodes.push({
      _id: key,
      key,
      name: NODE_NAMES[key] || key,
      parentId: null,
      order: graphNodes.length,
      meta: { subjectCode: q.subjectCode },
    })
  })

  const allFriends = (demoUser.demoFriends || []).map((f, i) => ({
    _id: `friend-${String(i + 1).padStart(2, '0')}`,
    id: `friend-${String(i + 1).padStart(2, '0')}`,
    email: f.email,
    name: f.name,
    school: f.school,
    grade: f.grade,
    major: f.major,
    role: 'student',
    learningLevel: 3 + (i % 4),
    points: 120 + i * 40,
    createdAt: daysAgo(60 - i),
  }))

  const pendingCount = Math.min(demoUser.pendingRequestCount || 0, allFriends.length)
  const requestMessages = demoUser.friendRequestMessages || []
  const pendingUsers = allFriends.slice(0, pendingCount)
  const friendUsers = allFriends.slice(pendingCount)

  const friendships = friendUsers.map((u, i) => ({
    _id: `fs-${u._id}`,
    friendId: u._id,
    friend: u,
    createdAt: daysAgo(30 - i),
  }))

  const friendRequests = pendingUsers.map((u, i) => ({
    _id: `fr-${u._id}`,
    fromUserId: u._id,
    toUserId: profile._id,
    fromUser: u,
    toUser: { _id: profile._id, name: profile.name, email: profile.email },
    message: requestMessages[i % requestMessages.length] || '请求添加好友',
    status: 'pending',
    createdAt: daysAgo(2 - Math.min(i, 1)),
  }))

  const authorOf = (raw) => {
    if (!raw || raw === 'target') return profile
    return allFriends.find((u) => u.email === raw) || profile
  }

  const notes = []
  ;(demoUser.notesForTarget || []).forEach((n, i) => {
    notes.push({
      _id: `note-me-${i + 1}`,
      userId: profile._id,
      author: { _id: profile._id, name: profile.name },
      type: n.type || 'general',
      title: n.title,
      content: n.content,
      summary: n.summary || '',
      tags: n.tags || [],
      isPublic: !!n.isPublic,
      knowledgeNodeId: n.knowledgeNodeId,
      shareToken: n.isPublic ? `share-me-${i + 1}` : null,
      createdAt: daysAgo(12 - i),
      updatedAt: daysAgo(3 - Math.min(i, 2)),
    })
  })
  ;(demoUser.notesFromFriends || []).forEach((n, i) => {
    const author = authorOf(n.friendEmail)
    notes.push({
      _id: `note-fr-${i + 1}`,
      userId: author._id,
      author: { _id: author._id, name: author.name },
      type: n.type || 'general',
      title: n.title,
      content: n.content,
      tags: n.tags || [],
      isPublic: true,
      createdAt: daysAgo(8 - i),
      updatedAt: daysAgo(4 - i),
    })
  })

  const statuses = ['unmastered', 'unmastered', 'learning', 'learning', 'mastered']
  const wrongQuestions = questions.slice(0, demoUser.wrongQuestionCount || 10).map((q, i) => {
    const status = statuses[i % statuses.length]
    return {
      _id: `wq-${q._id}`,
      userId: profile._id,
      questionId: q._id,
      question: q,
      subjectCode: q.subjectCode,
      knowledgeNodeId: q.knowledgeNodeId,
      category: i % 2 === 0 ? '数据结构' : '未分类',
      tags: ['演示'],
      mastery: status === 'mastered' ? 90 : status === 'learning' ? 45 : 10,
      masteryStatus: status,
      wrongCount: 1 + (i % 3),
      errorCount: 1 + (i % 3),
      reviewCount: i % 4,
      lastErrorAt: daysAgo(i % 5),
      nextReviewAt: i < 6 ? daysAgo(0) : daysAgo(-2),
      isMastered: status === 'mastered',
      updatedAt: daysAgo(i % 6),
    }
  })

  const studyPlanSpec = demoUser.studyPlan || {}
  const studyPlans = [
    {
      _id: 'plan-spring',
      userId: profile._id,
      name: studyPlanSpec.name || '春季备考计划',
      description: studyPlanSpec.description || '',
      type: studyPlanSpec.type || 'daily',
      startDate: dayStartIso(30),
      endDate: dayStartIso(-60),
      dailyTarget: studyPlanSpec.dailyTarget || 15,
      subjectCodes: studyPlanSpec.subjectCodes || [],
      status: 'active',
      stats: studyPlanSpec.stats || {},
    },
  ]

  const moods = ['great', 'good', 'normal', 'good', 'great', 'normal', 'good']
  const checkIns = []
  for (let i = 0; i < (studyPlanSpec.checkInDaysBack || 7); i += 1) {
    checkIns.push({
      _id: `checkin-${i}`,
      userId: profile._id,
      planId: studyPlans[0]._id,
      date: dayStartIso(i),
      studyDuration: 20 + i * 5,
      completedQuestions: 10 + i * 2,
      correctQuestions: 8 + i,
      mood: moods[i % moods.length],
      summary: i === 0 ? '今日演示打卡' : `第 ${i + 1} 天学习记录`,
    })
  }

  const reviewSpec = demoUser.reviewPlan || {}
  const reviewPlans = [
    {
      _id: 'rplan-daily',
      userId: profile._id,
      name: reviewSpec.name || '每日错题复习',
      description: reviewSpec.description || '',
      type: reviewSpec.type || 'daily',
      strategy: reviewSpec.strategy || 'due',
      dailyCount: reviewSpec.dailyCount || 10,
      status: 'active',
      createdAt: daysAgo(20),
    },
  ]

  const learningGoals = (demoUser.learningGoals || []).map((g, i) => ({
    _id: `goal-${i + 1}`,
    userId: profile._id,
    title: g.title,
    description: g.description || '',
    type: g.type,
    targetType: g.targetType,
    targetValue: g.targetValue,
    currentValue: g.currentValue,
    subjectCode: g.subjectCode,
    status: g.currentValue >= g.targetValue ? 'completed' : 'active',
    createdAt: daysAgo(18 - i),
  }))

  const favoriteFolders = (demoUser.favoriteFolders || []).map((f, i) => ({
    _id: `fav-folder-${i + 1}`,
    userId: profile._id,
    name: f.name,
    description: f.description || '',
    color: f.color,
    icon: f.icon,
    isDefault: !!f.isDefault,
  }))

  const favorites = questions.slice(0, 6).map((q, i) => ({
    _id: `fav-${q._id}`,
    userId: profile._id,
    questionId: q._id,
    question: q,
    folderId: favoriteFolders[i % favoriteFolders.length]?._id,
    createdAt: daysAgo(10 - i),
  }))

  const records = []
  const recordCount = demoUser.recordCount || 45
  const recordDays = demoUser.recordDaysBack || 14
  for (let i = 0; i < recordCount; i += 1) {
    const q = questions[i % questions.length]
    const day = i % recordDays
    const correct = i % 5 !== 0
    records.push({
      _id: `rec-${i + 1}`,
      userId: profile._id,
      questionId: q._id,
      knowledgeNodeId: q.knowledgeNodeId,
      subjectCode: q.subjectCode,
      type: q.type,
      isCorrect: correct,
      score: correct ? 1 : 0,
      mode: 'quiz',
      createdAt: daysAgo(day, 10 + (i % 8)),
    })
  }

  const achievements = (demoUser.achievements || []).map((a, i) => ({
    _id: `ach-${a.type}`,
    userId: profile._id,
    type: a.type,
    title: a.title,
    description: a.description,
    icon: a.icon,
    unlocked: true,
    unlockedAt: daysAgo(14 - i * 3),
  }))

  const notifications = (demoUser.notifications || []).map((n, i) => ({
    _id: `notif-${i + 1}`,
    userId: profile._id,
    type: n.type || 'system',
    title: n.title,
    content: n.content,
    isRead: !!n.isRead,
    read: !!n.isRead,
    link: n.link,
    relatedType: n.relatedType,
    createdAt: daysAgo(i),
  }))

  const emailToUser = Object.fromEntries(allFriends.map((u) => [u.email, u]))
  const messages = (demoUser.messages || []).map((m, i) => {
    const friend = emailToUser[m.friendEmail]
    const fromFriend = !!m.fromFriend
    const sender = fromFriend ? friend : profile
    const receiver = fromFriend ? profile : friend
    return {
      _id: `msg-${i + 1}`,
      senderId: sender?._id,
      receiverId: receiver?._id,
      sender: { _id: sender?._id, name: sender?.name, email: sender?.email },
      content: m.content,
      isRead: !fromFriend || i > 0,
      createdAt: daysAgo(1, 20 - i),
    }
  })

  const learningPosts = (demoUser.learningPosts || []).map((p, i) => {
    const author = authorOf(p.author)
    return {
      _id: `post-${i + 1}`,
      userId: author._id,
      author: { _id: author._id, name: author.name },
      type: p.type || 'text',
      title: p.title || '',
      content: p.content,
      likeCount: 2 + i,
      liked: false,
      createdAt: daysAgo(i + 1),
    }
  })

  const discussions = (demoUser.discussions || []).map((d, i) => {
    const author = authorOf(d.author)
    const replies = (d.replies || []).map((r, j) => {
      const ra = authorOf(r.author)
      return {
        _id: `reply-${i + 1}-${j + 1}`,
        author: { _id: ra._id, name: ra.name },
        userId: ra._id,
        content: r.content,
        createdAt: daysAgo(i, 14 + j),
      }
    })
    return {
      _id: `disc-${i + 1}`,
      author: { _id: author._id, name: author.name },
      userId: author._id,
      type: d.type || 'general',
      title: d.title,
      content: d.content,
      tags: d.tags || [],
      replies,
      replyCount: replies.length,
      likeCount: 4 + i,
      liked: false,
      createdAt: daysAgo(i + 2),
    }
  })

  const groups = [
    {
      _id: 'group-ds',
      name: '数据结构互助组',
      description: '一起刷 demo 题库，每周复盘错题。',
      code: 'DS2026',
      ownerId: profile._id,
      members: [
        { userId: profile._id, user: profile, role: 'owner' },
        ...friendUsers.slice(0, 3).map((u) => ({ userId: u._id, user: u, role: 'member' })),
      ],
      memberCount: 4,
      bankIds: ['demo-cs-ds'],
      assignments: [
        {
          _id: 'asg-1',
          title: '本周栈与队列 20 题',
          dueAt: daysAgo(-5),
          bankId: 'demo-cs-ds',
        },
      ],
      sharedQuestionIds: ['ds-001', 'ds-002', 'ds-003'],
      studyRoom: [
        { _id: 'room-1', userName: '王浩然', content: '今天先刷栈专题。', createdAt: daysAgo(1) },
      ],
      createdAt: daysAgo(25),
    },
  ]

  const shopItems = [
    { id: 'skip-card', name: '免错题卡', icon: '🎫', description: '练习时跳过一道错题不计次数', cost: 80 },
    { id: 'double-exp', name: '双倍经验卡', icon: '⚡', description: '一次练习结算经验翻倍', cost: 120 },
    { id: 'hint-card', name: '提示卡', icon: '💡', description: '查看一道题的关键思路', cost: 50 },
    { id: 'review-boost', name: '复习加速', icon: '⏩', description: '缩短错题下次复习间隔', cost: 90 },
  ]

  const shopInventory = {
    points: profile.points || 360,
    items: [{ id: 'hint-card', name: '提示卡', icon: '💡', quantity: 1 }],
  }

  const oauthBinds = { github: false, wechat: false }

  const mentorRelations = [
    {
      _id: 'mentor-1',
      masterId: friendUsers[1]?._id || friendUsers[0]?._id,
      apprenticeId: profile._id,
      master: friendUsers[1] || friendUsers[0],
      apprentice: profile,
      status: 'active',
      createdAt: daysAgo(15),
    },
  ]

  const friendChallenges = [
    {
      _id: 'chal-1',
      initiatorId: profile._id,
      participantId: friendUsers[0]?._id,
      initiator: profile,
      participant: friendUsers[0],
      title: '本周刷题 50 道',
      type: 'questions',
      targetValue: 50,
      initiatorProgress: 22,
      participantProgress: 18,
      status: 'active',
      createdAt: daysAgo(4),
    },
  ]

  const roleApplications = [
    {
      _id: 'role-app-1',
      userId: allFriends[0]._id,
      user: allFriends[0],
      targetRole: 'question_manager',
      reason: '想协助维护演示题库',
      status: 'pending',
      createdAt: daysAgo(1),
    },
  ]

  const operationLogs = [
    { _id: 'log-1', userId: profile._id, user: profile, action: 'login', detail: '演示登录', createdAt: daysAgo(0, 14) },
    { _id: 'log-2', userId: profile._id, user: profile, action: 'quiz_submit', detail: '提交练习 15 题', createdAt: daysAgo(0, 11) },
    { _id: 'log-3', userId: profile._id, user: profile, action: 'note_create', detail: '新建笔记', createdAt: daysAgo(1) },
  ]

  return {
    profile,
    subjects,
    banks,
    questions,
    graphNodes,
    users: [profile, ...allFriends],
    friendships,
    friendRequests,
    notes,
    wrongQuestions,
    studyPlans,
    checkIns,
    reviewPlans,
    learningGoals,
    favoriteFolders,
    favorites,
    records,
    achievements,
    notifications,
    messages,
    learningPosts,
    discussions,
    groups,
    shopItems,
    shopInventory,
    oauthBinds,
    mentorRelations,
    friendChallenges,
    roleApplications,
    operationLogs,
    seq: 5000,
  }
}

function revive(state) {
  return state && typeof state === 'object' ? state : buildFreshState()
}

let state = null

function loadState() {
  if (state) return state
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    state = raw ? revive(JSON.parse(raw)) : buildFreshState()
  } catch {
    state = buildFreshState()
  }
  return state
}

export function getDemoState() {
  return loadState()
}

export function persistDemoState() {
  if (typeof window === 'undefined' || !state) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota
  }
}

export function resetDemoState() {
  state = buildFreshState()
  persistDemoState()
  return state
}

export function nextDemoId(prefix = 'id') {
  const s = loadState()
  s.seq = (s.seq || 5000) + 1
  persistDemoState()
  return `${prefix}-${s.seq}`
}

export function nodeName(key) {
  return NODE_NAMES[key] || key || '知识点'
}
