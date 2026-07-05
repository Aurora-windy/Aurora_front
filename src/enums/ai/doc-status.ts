/**
 * AI 文档处理状态枚举（与后端 DocStatusEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.7
 * 后端: aurora-ai/.../enums/DocStatusEnum.java
 *
 * 0=处理中（向量切片/Prompt 拼装中），由异步任务回填 1/2。
 */

import type { EnumMeta } from '@/enums/types'

export enum DocStatus {
  PROCESSING = 0,
  COMPLETED = 1,
  FAILED = 2,
}

export const DocStatusMeta: Record<DocStatus, EnumMeta> = {
  [DocStatus.PROCESSING]: { label: '处理中', color: 'gold' },
  [DocStatus.COMPLETED]:  { label: '完成',   color: 'green' },
  [DocStatus.FAILED]:     { label: '失败',   color: 'red' },
}

export const getDocStatusMeta = (v: DocStatus): EnumMeta => DocStatusMeta[v]
