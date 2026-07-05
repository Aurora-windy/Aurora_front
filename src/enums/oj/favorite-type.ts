/**
 * 题目收藏类型枚举（与后端 FavoriteTypeEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.5
 * 后端: aurora-oj/.../enums/FavoriteTypeEnum.java
 */

import type { EnumMeta } from '@/enums/types'

export enum FavoriteType {
  WRONG = 1,
  FAVORITE = 2,
}

export const FavoriteTypeMeta: Record<FavoriteType, EnumMeta> = {
  [FavoriteType.WRONG]:    { label: '错题',   color: 'red' },
  [FavoriteType.FAVORITE]: { label: '收藏',   color: 'gold' },
}

export const getFavoriteTypeMeta = (v: FavoriteType): EnumMeta => FavoriteTypeMeta[v]
