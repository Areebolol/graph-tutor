import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const managerRoles = ['admin', 'question_manager']

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/Login.vue'),
      meta: { public: true, title: '登录' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../pages/Register.vue'),
      meta: { public: true, title: '注册' },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../pages/ForgotPassword.vue'),
      meta: { public: true, title: '忘记密码' },
    },
    { path: '/', redirect: '/home' },
    {
      path: '/',
      component: () => import('../layouts/AppLayout.vue'),
      children: [
        {
          path: 'home',
          name: 'home',
          component: () => import('../pages/Home.vue'),
          meta: { public: true, title: '首页' },
        },
        {
          path: 'graph',
          name: 'graph',
          component: () => import('../pages/Graph.vue'),
          meta: { title: '知识图谱', requireAuth: true },
        },
        {
          path: 'nodes',
          name: 'nodes',
          component: () => import('../pages/Nodes.vue'),
          meta: { title: '知识点', requireAuth: true },
        },
        {
          path: 'quiz',
          name: 'quiz',
          component: () => import('../pages/Quiz.vue'),
          meta: { title: '练习', requireAuth: true },
        },
        {
          path: 'exam',
          name: 'exam',
          component: () => import('../pages/Exam.vue'),
          meta: { title: '考试', requireAuth: true },
        },
        {
          path: 'result',
          name: 'result',
          component: () => import('../pages/Result.vue'),
          meta: { title: '结果', requireAuth: true },
        },
        {
          path: 'review',
          name: 'review',
          component: () => import('../pages/Review.vue'),
          meta: { title: '错题本', requireAuth: true },
        },
        {
          path: 'banks',
          name: 'banks',
          component: () => import('../pages/banks/BankList.vue'),
          meta: { title: '题库', requireAuth: true },
        },
        {
          path: 'banks/create',
          name: 'banks-create',
          component: () => import('../pages/banks/BankForm.vue'),
          meta: { title: '新建题库', requireAuth: true, requireRole: managerRoles },
        },
        {
          path: 'banks/import',
          name: 'banks-import',
          component: () => import('../pages/banks/BankImport.vue'),
          meta: { title: '题库导入', requireAuth: true, requireRole: managerRoles },
        },
        {
          path: 'banks/:id',
          name: 'banks-detail',
          component: () => import('../pages/banks/BankDetail.vue'),
          meta: { title: '题库详情', requireAuth: true },
        },
        {
          path: 'banks/:id/edit',
          name: 'banks-edit',
          component: () => import('../pages/banks/BankForm.vue'),
          meta: { title: '编辑题库', requireAuth: true, requireRole: managerRoles },
        },
        {
          path: 'questions',
          name: 'questions',
          component: () => import('../pages/questions/QuestionList.vue'),
          meta: { title: '题目', requireAuth: true },
        },
        {
          path: 'questions/create',
          name: 'questions-create',
          component: () => import('../pages/questions/QuestionEditor.vue'),
          meta: { title: '新建题目', requireAuth: true, requireRole: managerRoles },
        },
        {
          path: 'questions/:id',
          redirect: (to) => `/questions/${to.params.id}/detail`,
        },
        {
          path: 'questions/:id/detail',
          name: 'questions-detail',
          component: () => import('../pages/questions/QuestionDetail.vue'),
          meta: { title: '题目详情', requireAuth: true },
        },
        {
          path: 'questions/:id/edit',
          name: 'questions-edit',
          component: () => import('../pages/questions/QuestionEditor.vue'),
          meta: { title: '编辑题目', requireAuth: true, requireRole: managerRoles },
        },
        {
          path: 'statistics',
          redirect: '/analytics',
        },
        {
          path: 'analytics',
          name: 'analytics',
          component: () => import('../pages/Analytics.vue'),
          meta: { title: '学习数据', requireAuth: true },
        },
        {
          path: 'recommendations',
          name: 'recommendations',
          component: () => import('../pages/Recommendations.vue'),
          meta: { title: '智能推荐', requireAuth: true },
        },
        {
          path: 'learning-path',
          name: 'learning-path',
          component: () => import('../pages/LearningPath.vue'),
          meta: { title: '学习路径', requireAuth: true },
        },
        {
          path: 'shop',
          name: 'shop',
          component: () => import('../pages/Shop.vue'),
          meta: { title: '成就商城', requireAuth: true },
        },
        {
          path: 'favorites',
          name: 'favorites',
          component: () => import('../pages/Favorites.vue'),
          meta: { title: '收藏夹', requireAuth: true },
        },
        {
          path: 'study-plans',
          name: 'study-plans',
          component: () => import('../pages/StudyPlans.vue'),
          meta: { title: '学习计划', requireAuth: true },
        },
        {
          path: 'check-in',
          name: 'check-in',
          component: () => import('../pages/CheckIn.vue'),
          meta: { title: '每日打卡', requireAuth: true },
        },
        {
          path: 'skill-tree',
          name: 'skill-tree',
          component: () => import('../pages/SkillTree.vue'),
          meta: { title: '技能树', requireAuth: true },
        },
        {
          path: 'friends',
          name: 'friends',
          component: () => import('../pages/Friends.vue'),
          meta: { title: '好友', requireAuth: true },
        },
        {
          path: 'friends/discover',
          name: 'friends-discover',
          component: () => import('../pages/FriendsDiscover.vue'),
          meta: { title: '发现好友', requireAuth: true },
        },
        {
          path: 'users/:id',
          name: 'user-profile',
          component: () => import('../pages/UserProfile.vue'),
          meta: { title: '用户资料', requireAuth: true },
        },
        {
          path: 'messages',
          name: 'messages',
          component: () => import('../pages/Messages.vue'),
          meta: { title: '消息', requireAuth: true },
        },
        {
          path: 'community',
          name: 'community',
          component: () => import('../pages/Community.vue'),
          meta: { title: '社区', requireAuth: true },
        },
        {
          path: 'community/:id',
          name: 'community-detail',
          component: () => import('../pages/DiscussionDetail.vue'),
          meta: { title: '讨论详情', requireAuth: true },
        },
        {
          path: 'learning-posts',
          name: 'learning-posts',
          component: () => import('../pages/LearningPosts.vue'),
          meta: { title: '学习动态', requireAuth: true },
        },
        {
          path: 'leaderboard',
          name: 'leaderboard',
          component: () => import('../pages/Leaderboard.vue'),
          meta: { title: '排行榜', requireAuth: true },
        },
        {
          path: 'notes',
          name: 'notes',
          component: () => import('../pages/Notes.vue'),
          meta: { title: '笔记', requireAuth: true },
        },
        {
          path: 'notes/public',
          name: 'notes-public',
          component: () => import('../pages/PublicNotes.vue'),
          meta: { title: '公开笔记', requireAuth: true },
        },
        {
          path: 'notes/share/:token',
          name: 'notes-share',
          component: () => import('../pages/NoteShare.vue'),
          meta: { title: '分享笔记', public: true },
        },
        {
          path: 'notifications',
          name: 'notifications',
          component: () => import('../pages/Notifications.vue'),
          meta: { title: '通知', requireAuth: true },
        },
        {
          path: 'groups',
          name: 'groups',
          component: () => import('../pages/Groups.vue'),
          meta: { title: '群组', requireAuth: true },
        },
        {
          path: 'mentor',
          name: 'mentor',
          component: () => import('../pages/Mentor.vue'),
          meta: { title: '师徒', requireAuth: true },
        },
        {
          path: 'friend-challenges',
          name: 'friend-challenges',
          component: () => import('../pages/FriendChallenges.vue'),
          meta: { title: '好友挑战', requireAuth: true },
        },
        {
          path: 'achievements',
          name: 'achievements',
          component: () => import('../pages/Achievements.vue'),
          meta: { title: '成就', requireAuth: true },
        },
        {
          path: 'goals',
          name: 'goals',
          component: () => import('../pages/LearningGoals.vue'),
          meta: { title: '学习目标', requireAuth: true },
        },
        {
          path: 'review-plans',
          name: 'review-plans',
          component: () => import('../pages/ReviewPlans.vue'),
          meta: { title: '复习计划', requireAuth: true },
        },
        {
          path: 'admin',
          name: 'admin',
          component: () => import('../pages/Admin.vue'),
          meta: { title: '管理后台', requireAuth: true, requireAdmin: true },
        },
        {
          path: 'admin/users',
          name: 'admin-users',
          component: () => import('../pages/admin/UserManagement.vue'),
          meta: { title: '用户管理', requireAuth: true, requireAdmin: true },
        },
        {
          path: 'admin/operation-logs',
          name: 'admin-operation-logs',
          component: () => import('../pages/admin/OperationLogs.vue'),
          meta: { title: '操作日志', requireAuth: true, requireAdmin: true },
        },
        {
          path: 'admin/reports',
          name: 'admin-reports',
          component: () => import('../pages/admin/Reports.vue'),
          meta: { title: '统计报表', requireAuth: true, requireAdmin: true },
        },
        {
          path: 'admin/role-applications',
          name: 'admin-role-applications',
          component: () => import('../pages/admin/RoleApplicationManagement.vue'),
          meta: { title: '角色审批', requireAuth: true, requireAdmin: true },
        },
        {
          path: 'subjects',
          name: 'subjects',
          component: () => import('../pages/subjects/SubjectManagement.vue'),
          meta: { title: '学科管理', requireAuth: true },
        },
        {
          path: 'ai',
          name: 'ai',
          component: () => import('../pages/ai/AIConsole.vue'),
          meta: { title: 'AI 出题', requireAuth: true, requireRole: managerRoles },
        },
        {
          path: 'role/apply',
          name: 'role-apply',
          component: () => import('../pages/role/RoleApplication.vue'),
          meta: { title: '申请角色', requireAuth: true },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../pages/Settings.vue'),
          meta: { title: '设置', requireAuth: true },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../pages/Profile.vue'),
          meta: { title: '个人中心', requireAuth: true },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../pages/NotFound.vue'),
      meta: { public: true, title: '未找到' },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  document.title = to.meta.title ? `${to.meta.title} · GraphTutor` : 'GraphTutor'

  const needAuth = to.matched.some((r) => r.meta.requireAuth)
  if (needAuth && (!auth.token || !auth.user)) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  const userRole = auth.user?.role === 'user' ? 'student' : auth.user?.role

  if (to.matched.some((r) => r.meta.requireAdmin) && userRole !== 'admin') {
    return { path: '/home' }
  }

  const roleMeta = to.matched.find((r) => Array.isArray(r.meta.requireRole) && r.meta.requireRole.length)
  if (roleMeta && !roleMeta.meta.requireRole.includes(userRole)) {
    return { path: '/home' }
  }

  return true
})

export default router
