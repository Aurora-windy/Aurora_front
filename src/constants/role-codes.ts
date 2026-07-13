/**
 * 角色码常量（与后端 RoleCodeConst 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §3.2.3 / §4.2.3
 * 后端: aurora-common/.../constant/RoleCodeConst.java
 *
 * 6 个 canonical 角色由 baseline spec 锁定；DB sys_role.code 使用以下小写值。
 * 不做"角色管理 UI 添加新角色"功能。
 */

export const RoleCode = {
  ADMIN: 'admin',
  HR_ADMIN: 'hr_admin',
  EDU_ADMIN: 'edu_admin',
  EDU_TEACHER: 'edu_teacher',
  MALL_ADMIN: 'mall_admin',
  STUDENT: 'student',
} as const

export type RoleCode = (typeof RoleCode)[keyof typeof RoleCode]

export interface RoleCodeMeta {
  label: string
  description: string
}

export const RoleCodeMeta: Record<RoleCode, RoleCodeMeta> = {
  [RoleCode.ADMIN]:       { label: '系统管理员', description: '全栈权限，仅开发/演示期使用' },
  [RoleCode.HR_ADMIN]:    { label: '人事管理员', description: 'HR 模块全权' },
  [RoleCode.EDU_ADMIN]:   { label: '教务管理员', description: 'EDU 模块管理能力' },
  [RoleCode.EDU_TEACHER]: { label: '教师',       description: '教务模块任课教师' },
  [RoleCode.MALL_ADMIN]:  { label: '商城管理员', description: '电商模块全权' },
  [RoleCode.STUDENT]:     { label: '学生',       description: '默认登录角色，RBAC 资源主语' },
}

export const getRoleCodeMeta = (code: RoleCode): RoleCodeMeta => RoleCodeMeta[code]

export const ALL_ROLE_CODES: readonly RoleCode[] = Object.values(RoleCode)
