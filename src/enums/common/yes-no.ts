/**
 * 通用是否枚举（与后端 YesNoEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.1
 * 后端: aurora-common/.../enums/YesNoEnum.java
 *
 * 用于：是否默认、是否秒杀、是否样例等二元字段。
 */

import type { EnumMeta } from '@/enums/types'

export enum YesNo {
  NO = 0,
  YES = 1,
}

export const YesNoMeta: Record<YesNo, EnumMeta> = {
  [YesNo.NO]:  { label: '否', color: 'gray' },
  [YesNo.YES]: { label: '是', color: 'green' },
}

export const getYesNoMeta = (v: YesNo): EnumMeta => YesNoMeta[v]

export const yesNoFromCode = (code: number): YesNo => (code === 1 ? YesNo.YES : YesNo.NO)
