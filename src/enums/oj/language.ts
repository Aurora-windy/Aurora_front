/**
 * 编程语言枚举（与后端 LanguageEnum 一一对应；双值枚举）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.5 / §4.1.5.1
 * 后端: aurora-oj/.../enums/LanguageEnum.java
 *
 * DB 存 int；接口响应用字符串 value（"java" 等），前端 Monaco Editor
 * 直接用 value 切语言，避免再做 int→string 映射。
 *
 * 后端 @JsonValue 标在 value 上 → 前端 axios 拿到的就是字符串。
 * 但前端表单提交时如果需要 int code（例如筛选条件），可用 LanguageValueMap 反查。
 */

import type { EnumMeta } from '@/enums/types'

export enum Language {
  JAVA = 1,
  PYTHON = 2,
  GO = 3,
  CPP = 4,
}

/** int code → string value（与后端 LLM 协议/Monaco Editor 直接对接） */
export const LanguageValueMap: Record<Language, string> = {
  [Language.JAVA]:   'java',
  [Language.PYTHON]: 'python',
  [Language.GO]:     'go',
  [Language.CPP]:    'cpp',
}

export const LanguageMeta: Record<Language, EnumMeta> = {
  [Language.JAVA]:   { label: 'Java',    color: 'orange' },
  [Language.PYTHON]: { label: 'Python',  color: 'blue' },
  [Language.GO]:     { label: 'Go',      color: 'cyan' },
  [Language.CPP]:    { label: 'C++',     color: 'purple' },
}

export const getLanguageMeta = (v: Language): EnumMeta => LanguageMeta[v]
export const getLanguageValue = (v: Language): string => LanguageValueMap[v]

/** 反查：string value → int code（表单提交场景） */
export const languageFromValue = (value: string): Language | null => {
  for (const [k, v] of Object.entries(LanguageValueMap)) {
    if (v === value) return Number(k) as Language
  }
  return null
}
