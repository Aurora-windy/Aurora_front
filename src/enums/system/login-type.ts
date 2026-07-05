/**
 * 登录方式枚举（与后端 LoginTypeEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.2
 * 后端: aurora-common/.../enums/system/LoginTypeEnum.java
 *
 * 本期仅 ACCOUNT 实装，SMS / OAUTH 占位（UI 上可以显示但不开放入口）。
 */

import type { EnumMeta } from '@/enums/types'

export enum LoginType {
  ACCOUNT = 1,
  SMS = 2,
  OAUTH = 3,
}

export const LoginTypeMeta: Record<LoginType, EnumMeta> = {
  [LoginType.ACCOUNT]: { label: '账号',  color: 'blue' },
  [LoginType.SMS]:     { label: '短信',  color: 'gold' },
  [LoginType.OAUTH]:   { label: 'OAuth', color: 'purple' },
}

export const getLoginTypeMeta = (v: LoginType): EnumMeta => LoginTypeMeta[v]
