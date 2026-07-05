/**
 * 性别枚举（与后端 GenderEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.1
 * 后端: aurora-common/.../enums/GenderEnum.java
 */

import type { EnumMeta, TagColor } from '@/enums/types'

export enum Gender {
  UNKNOWN = 0,
  MALE = 1,
  FEMALE = 2,
}

export const GenderMeta: Record<Gender, EnumMeta> = {
  [Gender.UNKNOWN]: { label: '未知', color: 'gray' },
  [Gender.MALE]:    { label: '男',   color: 'blue' },
  [Gender.FEMALE]:  { label: '女',   color: 'pink' },
}

export const getGenderMeta = (v: Gender): EnumMeta => GenderMeta[v]

export const GENDER_COLOR: TagColor = 'gray'
