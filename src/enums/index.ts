/**
 * 枚举桶导
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.5
 *
 * 使用方式：
 *   import { OrderStatus, getOrderStatusMeta } from '@/enums'
 *
 * 镜像后端 27 个枚举（详见 docs/specs/2026-07-05-global-variables.md §4.1）。
 * 后端任何枚举值变更必须同步本目录，单测见 __tests__/sync.spec.ts。
 */

// 公共类型
export type { TagColor, EnumMeta, DualValueEnumMeta } from './types'

// 通用枚举（aurora-common）
export * from './common/gender'
export * from './common/status'
export * from './common/yes-no'

// 系统枚举（aurora-common/enums/system）
export * from './system/menu-type'
export * from './system/data-scope'
export * from './system/login-type'

// HR（aurora-hr）
export * from './hr/emp-status'
export * from './hr/attendance-status'
export * from './hr/appeal-status'

// EDU（aurora-edu）
export * from './edu/course-category'
export * from './edu/student-status'
export * from './edu/teacher-title'

// OJ（aurora-oj）
export * from './oj/difficulty'
export * from './oj/language'
export * from './oj/judge-status'
export * from './oj/favorite-type'

// MALL（aurora-mall）
export * from './mall/order-status'
export * from './mall/pay-type'
export * from './mall/product-status'
export * from './mall/stock-biz-type'

// AI（aurora-ai）
export * from './ai/chat-role'
export * from './ai/doc-status'
