export function isAdmin(user) {
  if (!user) return false
  return user.role === 'admin' || user.isAdmin === true
}

export function isQuestionManager(user) {
  if (!user) return false
  return user.role === 'question_manager'
}

export function isStudent(user) {
  if (!user) return false
  const role = user.role === 'user' ? 'student' : user.role
  return role === 'student'
}

export function canManageResources(user) {
  return isAdmin(user) || isQuestionManager(user)
}

export function hasRole(user, roles) {
  if (!user || !roles) return false
  const userRole = user.role === 'user' ? 'student' : user.role
  if (Array.isArray(roles)) return roles.includes(userRole)
  return userRole === roles
}

export function getRoleName(role) {
  const roleMap = {
    admin: '管理员',
    question_manager: '出题负责人',
    student: '学习者',
    user: '学习者',
  }
  return roleMap[role] || '未知角色'
}
