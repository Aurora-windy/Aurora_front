/**
 * 判题结果状态枚举（与后端 JudgeStatusEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.5
 * 后端: aurora-oj/.../enums/JudgeStatusEnum.java
 *
 * 0=PENDING 由提交瞬间写入；1-7 由沙箱回填。
 * abbr 字段（"AC"/"WA"/...）保留 OJ 题目通用英文缩写，UI 上常作为缩略标签使用。
 */

import type { EnumMeta } from '@/enums/types'

export enum JudgeStatus {
  PENDING = 0,
  ACCEPTED = 1,
  WRONG_ANSWER = 2,
  TIME_LIMIT_EXCEEDED = 3,
  MEMORY_LIMIT_EXCEEDED = 4,
  RUNTIME_ERROR = 5,
  COMPILE_ERROR = 6,
  SYSTEM_ERROR = 7,
}

export interface JudgeStatusMeta extends EnumMeta {
  /** OJ 通用英文缩写（"AC"/"WA"/"TLE" 等） */
  abbr: string
}

export const JudgeStatusMeta: Record<JudgeStatus, JudgeStatusMeta> = {
  [JudgeStatus.PENDING]:               { label: '排队中',   color: 'gray',    abbr: 'Pending' },
  [JudgeStatus.ACCEPTED]:              { label: '答案正确', color: 'green',   abbr: 'AC' },
  [JudgeStatus.WRONG_ANSWER]:          { label: '答案错误', color: 'red',     abbr: 'WA' },
  [JudgeStatus.TIME_LIMIT_EXCEEDED]:   { label: '时间超限', color: 'orange',  abbr: 'TLE' },
  [JudgeStatus.MEMORY_LIMIT_EXCEEDED]: { label: '内存超限', color: 'orange',  abbr: 'MLE' },
  [JudgeStatus.RUNTIME_ERROR]:         { label: '运行错误', color: 'gold',    abbr: 'RE' },
  [JudgeStatus.COMPILE_ERROR]:         { label: '编译错误', color: 'purple',  abbr: 'CE' },
  [JudgeStatus.SYSTEM_ERROR]:          { label: '系统错误', color: 'pink',    abbr: 'SE' },
}

export const getJudgeStatusMeta = (v: JudgeStatus): JudgeStatusMeta => JudgeStatusMeta[v]
