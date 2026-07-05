/**
 * 商品上下架状态枚举（与后端 ProductStatusEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.6
 * 后端: aurora-mall/.../enums/ProductStatusEnum.java
 *
 * 语义等同于 StatusEnum，但 MALL 域习惯用「上架/下架」文案，单独建枚举。
 */

import type { EnumMeta } from '@/enums/types'

export enum ProductStatus {
  OFF_SHELF = 0,
  ON_SHELF = 1,
}

export const ProductStatusMeta: Record<ProductStatus, EnumMeta> = {
  [ProductStatus.OFF_SHELF]: { label: '下架', color: 'gray' },
  [ProductStatus.ON_SHELF]:  { label: '上架', color: 'green' },
}

export const getProductStatusMeta = (v: ProductStatus): EnumMeta =>
  ProductStatusMeta[v]
