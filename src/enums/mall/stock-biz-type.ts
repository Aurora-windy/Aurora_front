/**
 * 库存变动溯源业务类型枚举（与后端 StockBizTypeEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.6
 * 后端: aurora-mall/.../enums/StockBizTypeEnum.java
 *
 * 每次库存变动（含正负）必带此值，便于事后审计与异常排查。
 */

import type { EnumMeta } from '@/enums/types'

export enum StockBizType {
  ORDER_DEDUCT = 1,
  CANCEL_ROLLBACK = 2,
  REFUND_ROLLBACK = 3,
  MANUAL_ADJUST = 4,
}

export const StockBizTypeMeta: Record<StockBizType, EnumMeta> = {
  [StockBizType.ORDER_DEDUCT]:    { label: '下单扣减',   color: 'red' },
  [StockBizType.CANCEL_ROLLBACK]: { label: '取消回滚',   color: 'gold' },
  [StockBizType.REFUND_ROLLBACK]: { label: '退款回滚',   color: 'blue' },
  [StockBizType.MANUAL_ADJUST]:   { label: '人工调整',   color: 'purple' },
}

export const getStockBizTypeMeta = (v: StockBizType): EnumMeta =>
  StockBizTypeMeta[v]
