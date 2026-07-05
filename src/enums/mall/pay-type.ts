/**
 * 支付方式枚举（与后端 PayTypeEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.6
 * 后端: aurora-mall/.../enums/PayTypeEnum.java
 *
 * 本期仅 SIMULATION 实装，微信/支付宝占位（毕设答辩演示用模拟支付）。
 */

import type { EnumMeta } from '@/enums/types'

export enum PayType {
  WECHAT = 1,
  ALIPAY = 2,
  SIMULATION = 3,
}

export const PayTypeMeta: Record<PayType, EnumMeta> = {
  [PayType.WECHAT]:     { label: '微信',     color: 'green' },
  [PayType.ALIPAY]:     { label: '支付宝',   color: 'blue' },
  [PayType.SIMULATION]: { label: '模拟支付', color: 'purple' },
}

export const getPayTypeMeta = (v: PayType): EnumMeta => PayTypeMeta[v]
