/**
 * 课程类别枚举（与后端 CourseCategoryEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.4
 * 后端: aurora-edu/.../enums/CourseCategoryEnum.java
 */

import type { EnumMeta } from '@/enums/types'

export enum CourseCategory {
  REQUIRED = 1,
  OPTIONAL = 2,
  PUBLIC = 3,
}

export const CourseCategoryMeta: Record<CourseCategory, EnumMeta> = {
  [CourseCategory.REQUIRED]: { label: '必修', color: 'red' },
  [CourseCategory.OPTIONAL]: { label: '选修', color: 'blue' },
  [CourseCategory.PUBLIC]:   { label: '公选', color: 'purple' },
}

export const getCourseCategoryMeta = (v: CourseCategory): EnumMeta =>
  CourseCategoryMeta[v]
