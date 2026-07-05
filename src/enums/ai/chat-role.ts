/**
 * 对话角色枚举（与后端 ChatRoleEnum 一一对应；双值枚举）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.1.7
 * 后端: aurora-ai/.../enums/ChatRoleEnum.java
 *
 * DB 存 int；接口响应用字符串 value（"user"/"assistant"/"system"），
 * 与 OpenAI/Spring AI ChatMessage 协议直接对齐，省一层转换。
 */

import type { EnumMeta } from '@/enums/types'

export enum ChatRole {
  USER = 1,
  ASSISTANT = 2,
  SYSTEM = 3,
}

/** int code → string value（直接喂 LLM 协议） */
export const ChatRoleValueMap: Record<ChatRole, string> = {
  [ChatRole.USER]:      'user',
  [ChatRole.ASSISTANT]: 'assistant',
  [ChatRole.SYSTEM]:    'system',
}

export const ChatRoleMeta: Record<ChatRole, EnumMeta> = {
  [ChatRole.USER]:      { label: '用户', color: 'blue' },
  [ChatRole.ASSISTANT]: { label: '助手', color: 'green' },
  [ChatRole.SYSTEM]:    { label: '系统', color: 'gray' },
}

export const getChatRoleMeta = (v: ChatRole): EnumMeta => ChatRoleMeta[v]
export const getChatRoleValue = (v: ChatRole): string => ChatRoleValueMap[v]

/** 反查：string value → int code */
export const chatRoleFromValue = (value: string): ChatRole | null => {
  for (const [k, v] of Object.entries(ChatRoleValueMap)) {
    if (v === value) return Number(k) as ChatRole
  }
  return null
}
