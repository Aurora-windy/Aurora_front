/**
 * 通用启停状态枚举（与后端 StatusEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.1
 * 后端: aurora-common/.../enums/StatusEnum.java
 *
 * 用于：用户、角色、商品、岗位、菜单等需要"启用/禁用"的场景。
 */

import type { EnumMeta } from '@/enums/types'

export enum Status {
  DISABLED = 0,
  ENABLED = 1,
}

export const StatusMeta: Record<Status, EnumMeta> = {
  [Status.DISABLED]: { label: '禁用', color: 'red' },
  [Status.ENABLED]:  { label: '启用', color: 'green' },
}

export const getStatusMeta = (v: Status): EnumMeta => StatusMeta[v]

export const statusFromCode = (code: number): Status =>
  code === Status.ENABLED ? Status.ENABLED : Status.DISABLED
