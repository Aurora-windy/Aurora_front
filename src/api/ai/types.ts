import type { ApiId, PageQuery } from '@/api/system/types'

export type ProviderUsageType = 'CHAT' | 'EMBEDDING' | 'BOTH'

export interface PageResult<T> {
  list: T[]
  total: number
}

export interface ProviderQuery extends PageQuery {
  code?: string
  name?: string
  model?: string
  enabled?: number
}

export interface ProviderResp {
  id: ApiId
  code: string
  name: string
  model: string
  usageType: ProviderUsageType
  embeddingDimension?: number
  temperature?: number
  maxTokens?: number
  timeoutSeconds?: number
  enabled: boolean
  sortOrder?: number
  hasApiKey: boolean
  createTime?: string
}

export interface ProviderOptionResp {
  id: ApiId
  code: string
  name: string
  model: string
  usageType: ProviderUsageType
  embeddingDimension?: number
  temperature?: number
  maxTokens?: number
  timeoutSeconds?: number
  sortOrder?: number
}

export interface ProviderForm {
  code: string
  name: string
  baseUrl?: string
  apiKey?: string
  model: string
  usageType?: ProviderUsageType
  embeddingDimension?: number
  temperature?: number
  maxTokens?: number
  timeoutSeconds?: number
  enabled?: boolean
  sortOrder?: number
}

export interface ProviderEnabledReq {
  enabled: boolean
}

export interface ProviderTestResp {
  success: boolean
  message?: string
  durationMs?: number
}

export interface EmbeddingConfigResp {
  id?: ApiId
  model?: string
  dimension?: number
  timeoutSeconds?: number
  enabled?: boolean
  hasApiKey?: boolean
  createTime?: string
}

export interface EmbeddingConfigForm {
  baseUrl?: string
  apiKey?: string
  model: string
  dimension?: number
  timeoutSeconds?: number
  enabled?: boolean
}

export interface KnowledgeDocQuery extends PageQuery {
  title?: string
  type?: string
  status?: string
}

export interface KnowledgeDocResp {
  id: ApiId
  title: string
  type: string
  status: string
  content: string
  summary?: string
  version?: number
  publishedAt?: string
  createTime?: string
}

export interface KnowledgeDocForm {
  title: string
  type: string
  content: string
  summary?: string
}

export interface KnowledgePublishResp {
  docId: ApiId
  chunkCount: number
  embeddedCount: number
  skippedCount: number
}

export interface KnowledgeCitation {
  docId: ApiId
  docTitle: string
  docType: string
  chunkId: ApiId
  snippet?: string
  score?: number
}

export interface KnowledgeSearchReq {
  query: string
  topK?: number
}

export interface CreateSessionReq {
  title?: string
  providerId?: ApiId
}

export interface SendMessageReq {
  content: string
}

export interface ChatSessionResp {
  id: ApiId
  userId: ApiId
  title: string
  providerId?: ApiId
  model?: string
  status: string
  lastMessageAt?: string
  createTime?: string
}

export interface ChatSessionQuery extends PageQuery {
  userId?: ApiId
  providerId?: ApiId
  title?: string
  model?: string
  status?: string
}

export interface ChatMessageResp {
  id: ApiId
  sessionId: ApiId
  role: string
  content: string
  metadataJson?: string
  createdAt?: string
}

export interface ActionResp {
  id: ApiId
  sessionId: ApiId
  messageId?: ApiId
  actionType: string
  toolName: string
  planSummary: string
  paramsJson?: string
  riskSummary?: string
  status: string
  resultSummary?: string
  errorMessage?: string
  confirmedAt?: string
  executedAt?: string
}

export interface ActionResultResp {
  actionId: ApiId
  status: string
  resultSummary?: string
  errorMessage?: string
}

export interface ToolResult {
  success: boolean
  data?: unknown
  summary?: string
  errorCode?: string
  errorMessage?: string
}

export interface ChatSendResp {
  userMessage: ChatMessageResp
  assistantMessage: ChatMessageResp
  citations?: KnowledgeCitation[]
  pendingAction?: ActionResp
  toolResult?: ToolResult
}

export interface ToolCallLogQuery extends PageQuery {
  sessionId?: ApiId
  actionId?: ApiId
  userId?: ApiId
  providerId?: ApiId
  toolName?: string
  permissionCode?: string
  success?: number
}

export interface ToolCallLogResp {
  id: ApiId
  sessionId?: ApiId
  actionId?: ApiId
  userId?: ApiId
  providerId?: ApiId
  toolName: string
  permissionCode?: string
  paramsSummary?: string
  success?: number
  resultSummary?: string
  errorCode?: string
  errorMessage?: string
  startedAt?: string
  finishedAt?: string
  createTime?: string
}


