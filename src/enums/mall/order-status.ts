/**
 * 订单状态枚举（与后端 OrderStatusEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.6
 * 后端: aurora-mall/.../enums/OrderStatusEnum.java
 *
 * 状态机：0→1（支付）→2（发货）→3（完成）；0→4（取消）；1/2→5（退款）
 * 扩展值预留：6=待发货（如未来拆分待发货/已发货）
 */

import type { EnumMeta } from '@/enums/types'

export enum OrderStatus {
  PENDING_PAYMENT = 0,
  PAID = 1,
  SHIPPED = 2,
  COMPLETED = 3,
  CANCELLED = 4,
  REFUNDED = 5,
}

export const OrderStatusMeta: Record<OrderStatus, EnumMeta> = {
  [OrderStatus.PENDING_PAYMENT]: { label: '待支付', color: 'gold' },
  [OrderStatus.PAID]:            { label: '已支付', color: 'blue' },
  [OrderStatus.SHIPPED]:         { label: '已发货', color: 'cyan' },
  [OrderStatus.COMPLETED]:       { label: '已完成', color: 'green' },
  [OrderStatus.CANCELLED]:       { label: '已取消', color: 'gray' },
  [OrderStatus.REFUNDED]:        { label: '已退款', color: 'red' },
}

export const getOrderStatusMeta = (v: OrderStatus): EnumMeta => OrderStatusMeta[v]
