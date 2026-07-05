/**
 * 学籍状态枚举（与后端 StudentStatusEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.4
 * 后端: aurora-edu/.../enums/StudentStatusEnum.java
 */

import type { EnumMeta } from '@/enums/types'

export enum StudentStatus {
  IN_SCHOOL = 1,
  SUSPENDED = 2,
  GRADUATED = 3,
  DROPPED = 4,
}

export const StudentStatusMeta: Record<StudentStatus, EnumMeta> = {
  [StudentStatus.IN_SCHOOL]: { label: '在读', color: 'green' },
  [StudentStatus.SUSPENDED]: { label: '休学', color: 'gold' },
  [StudentStatus.GRADUATED]: { label: '毕业', color: 'blue' },
  [StudentStatus.DROPPED]:   { label: '退学', color: 'red' },
}

export const getStudentStatusMeta = (v: StudentStatus): EnumMeta =>
  StudentStatusMeta[v]
