/**
 * 考勤申诉状态枚举（与后端 AppealStatusEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.3
 * 后端: aurora-hr/.../enums/AppealStatusEnum.java
 */

import type { EnumMeta } from '@/enums/types'

export enum AppealStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

export const AppealStatusMeta: Record<AppealStatus, EnumMeta> = {
  [AppealStatus.PENDING]:  { label: '待审核', color: 'gold' },
  [AppealStatus.APPROVED]: { label: '通过',   color: 'green' },
  [AppealStatus.REJECTED]: { label: '驳回',   color: 'red' },
}

export const getAppealStatusMeta = (v: AppealStatus): EnumMeta => AppealStatusMeta[v]
