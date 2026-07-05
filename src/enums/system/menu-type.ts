/**
 * 菜单类型枚举（与后端 MenuTypeEnum 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.2
 * 后端: aurora-common/.../enums/system/MenuTypeEnum.java
 */

import type { EnumMeta } from '@/enums/types'

export enum MenuType {
  DIRECTORY = 1,
  MENU = 2,
  BUTTON = 3,
}

export const MenuTypeMeta: Record<MenuType, EnumMeta> = {
  [MenuType.DIRECTORY]: { label: '目录', color: 'blue' },
  [MenuType.MENU]:      { label: '菜单', color: 'green' },
  [MenuType.BUTTON]:    { label: '按钮', color: 'gray' },
}

export const getMenuTypeMeta = (v: MenuType): EnumMeta => MenuTypeMeta[v]

export const menuTypeFromCode = (code: number): MenuType | null => {
  const found = (Object.values(MenuType) as number[]).includes(code)
  return found ? (code as MenuType) : null
}
