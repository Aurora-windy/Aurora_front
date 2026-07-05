/**
 * 考勤状态枚举（与后端 AttendanceStatusEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.3
 * 后端: aurora-hr/.../enums/AttendanceStatusEnum.java
 *
 * 0=缺卡由定时任务生成，1/2/3 由签到时间自动判定，4 由申诉通过后覆盖。
 */

import type { EnumMeta } from '@/enums/types'

export enum AttendanceStatus {
  MISSING = 0,
  NORMAL = 1,
  LATE = 2,
  EARLY_LEAVE = 3,
  APPROVED = 4,
}

export const AttendanceStatusMeta: Record<AttendanceStatus, EnumMeta> = {
  [AttendanceStatus.MISSING]:     { label: '缺卡',           color: 'red' },
  [AttendanceStatus.NORMAL]:      { label: '正常',           color: 'green' },
  [AttendanceStatus.LATE]:        { label: '迟到',           color: 'orange' },
  [AttendanceStatus.EARLY_LEAVE]: { label: '早退',           color: 'gold' },
  [AttendanceStatus.APPROVED]:    { label: '正常(已审批)',   color: 'arcoblue' },
}

export const getAttendanceStatusMeta = (v: AttendanceStatus): EnumMeta =>
  AttendanceStatusMeta[v]
