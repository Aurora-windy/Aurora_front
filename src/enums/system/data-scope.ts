/**
 * 数据权限范围枚举（与后端 DataScopeEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.2
 * 后端: aurora-common/.../enums/system/DataScopeEnum.java
 *
 * sys_role.data_scope 字段；前端主要用于角色管理 UI 的下拉选项展示。
 */

import type { EnumMeta } from '@/enums/types'

export enum DataScope {
  ALL = 1,
  DEPT = 2,
  SELF = 3,
}

export const DataScopeMeta: Record<DataScope, EnumMeta> = {
  [DataScope.ALL]:  { label: '全部',           color: 'red' },
  [DataScope.DEPT]: { label: '本部门及下级',   color: 'blue' },
  [DataScope.SELF]: { label: '本人',           color: 'gray' },
}

export const getDataScopeMeta = (v: DataScope): EnumMeta => DataScopeMeta[v]
