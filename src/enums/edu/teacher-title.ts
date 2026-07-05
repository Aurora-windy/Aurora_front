/**
 * 教师职称枚举（与后端 TeacherTitleEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.4
 * 后端: aurora-edu/.../enums/TeacherTitleEnum.java
 */

import type { EnumMeta } from '@/enums/types'

export enum TeacherTitle {
  PROFESSOR = 1,
  ASSOCIATE_PROF = 2,
  LECTURER = 3,
  ASSISTANT = 4,
}

export const TeacherTitleMeta: Record<TeacherTitle, EnumMeta> = {
  [TeacherTitle.PROFESSOR]:      { label: '教授',    color: 'red' },
  [TeacherTitle.ASSOCIATE_PROF]: { label: '副教授',  color: 'orange' },
  [TeacherTitle.LECTURER]:       { label: '讲师',    color: 'blue' },
  [TeacherTitle.ASSISTANT]:      { label: '助教',    color: 'gray' },
}

export const getTeacherTitleMeta = (v: TeacherTitle): EnumMeta =>
  TeacherTitleMeta[v]
