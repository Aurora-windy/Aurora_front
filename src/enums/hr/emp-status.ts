/**
 * 员工状态枚举（与后端 EmpStatusEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.3
 * 后端: aurora-hr/.../enums/EmpStatusEnum.java
 */

import type { EnumMeta } from '@/enums/types'

export enum EmpStatus {
  QUIT = 0,
  ACTIVE = 1,
  PROBATION = 2,
  LEAVE = 3,
}

export const EmpStatusMeta: Record<EmpStatus, EnumMeta> = {
  [EmpStatus.QUIT]:       { label: '离职', color: 'red' },
  [EmpStatus.ACTIVE]:     { label: '在职', color: 'green' },
  [EmpStatus.PROBATION]:  { label: '试用', color: 'gold' },
  [EmpStatus.LEAVE]:      { label: '休假', color: 'blue' },
}

export const getEmpStatusMeta = (v: EmpStatus): EnumMeta => EmpStatusMeta[v]
