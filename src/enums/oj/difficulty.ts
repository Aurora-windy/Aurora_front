/**
 * 题目难度枚举（与后端 DifficultyEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.5
 * 后端: aurora-oj/.../enums/DifficultyEnum.java
 */

import type { EnumMeta } from '@/enums/types'

export enum Difficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
}

export const DifficultyMeta: Record<Difficulty, EnumMeta> = {
  [Difficulty.EASY]:   { label: '简单', color: 'green' },
  [Difficulty.MEDIUM]: { label: '中等', color: 'gold' },
  [Difficulty.HARD]:   { label: '困难', color: 'red' },
}

export const getDifficultyMeta = (v: Difficulty): EnumMeta => DifficultyMeta[v]
