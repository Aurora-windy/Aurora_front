/**
 * 枚举公共类型
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.5.2
 *
 * color 取值必须在 Arco Design Vue 的 Tag 组件支持范围内，
 * 或项目主色自定义 'primary'（蓝色系，对应极光主题色）。
 */

export type TagColor =
  | 'red'
  | 'orange'
  | 'gold'
  | 'lime'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'arcoblue'
  | 'purple'
  | 'pink'
  | 'gray'
  | 'primary'

export interface EnumMeta {
  /** 中文显示文案 */
  label: string
  /** Arco Tag 颜色（UI 渲染用） */
  color: TagColor
}

/** 双值枚举（int code + string value）的元数据 */
export interface DualValueEnumMeta extends EnumMeta {
  /** 字符串标识（如 "java" / "user"），与后端 @JsonValue 一致 */
  value: string
}
